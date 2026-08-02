# WEC-LC — English Curriculum Framework

*Authored per your Executive Directive: "Curriculum First." Companion
to `docs/lms-architecture.md` (the platform that delivers this
curriculum) and `docs/curriculum-level-1-foundation.md` (the first
level built out to full lesson-by-lesson depth, per this document's
framework). This is WEC-LC's own curriculum design — informed by the
Common European Framework of Reference for Languages (CEFR), a public
reference standard, but not a reproduction of any publisher's
proprietary syllabus, and not a claim of formal CEFR certification or
accreditation (WEC-LC holds none — see `docs/editorial-bible.md`'s
standing discipline on this).*

---

## Executive Decision: six-level structure confirmed

Resolved. You confirmed WEC-LC retains its existing, published
six-level structure — Foundation (I, A1) → Elementary (II, A2) →
Intermediate (III, B1) → Upper Intermediate (IV, B2) → Advanced
(V, C1) → English Mastery (VI, C2) — with **no separate
Pre-Intermediate level**. Pre-Intermediate learning outcomes are
instead incorporated *within* Level III's own progression (see that
level's section below, and its module sequencing, once authored) —
a lower-to-upper B1 progression inside one level rather than a
seventh programme tier. This preserves the published tuition model
($19,000/$3,166.67 per level), the seeded `programme_levels` table,
and every mechanism keyed off it (`enrolments`, `payments`, the
progressive-unlock logic in Executive Decision #1) exactly as they
already are — no schema or pricing change resulted from this decision.

---

## Curriculum philosophy

WEC-LC's programme is not a grammar-topic checklist. Four principles
run through every level:

1. **Integrated four skills, not siloed ones.** Every thematic module
   develops listening, speaking, reading, and writing together around
   one topic and one grammar/vocabulary target, so a learner practises
   the same language in multiple modes before moving on — not a
   "grammar unit" followed by an unrelated "reading unit."
2. **Communicative competence over rule memorisation.** Grammar and
   vocabulary are taught as tools for real tasks (booking a hotel room,
   negotiating a deadline, structuring an argument), assessed by
   whether a learner can actually do the task, not only recite the
   rule.
3. **Escalating register and purpose.** Foundation through Intermediate
   builds general/social English; Upper Intermediate through Mastery
   deliberately layers in **academic English** (essay structure,
   source synthesis, seminar discussion), **professional
   communication** (email register, meetings, negotiation, reports),
   **critical thinking**, and **public speaking** — the explicit
   capabilities a learner needs for international study, business, and
   leadership, not just "more advanced grammar."
4. **Assessment as progression, not just measurement.** Every module
   ends with formative checks; every level ends with a proctorable
   examination covering all four skills plus the level's grammar/
   vocabulary scope. Passing a level's examination is what the
   platform's `unit_progress`/`completeLevel()` mechanism (see
   `docs/lms-architecture.md`) is designed to gate on, once real
   grading exists — today, per Milestone 1, that gate is a human
   (staff) decision; the assessment design below is what that human
   judgement will eventually be checking against, and what an
   automated marking engine (Milestone 2+) will score against for
   objective item types.

**Structural convention used throughout:** each level's published "120
learning units" (`programme_levels.units` — an already-confirmed
figure) is organised into **10 thematic modules**, paced across the
level's four-month term. This is a breakdown of an existing number,
not a change to it — nothing about total programme length, unit count,
or pricing is altered by this document.

---

## The learner journey

| Level | Roman | CEFR | Focus |
|---|---|---|---|
| Foundation Programme | I | A1 | Survival English — the learner can function in immediate, everyday situations using memorised phrases and simple sentences. |
| Elementary Programme | II | A2 | Routine English — the learner handles familiar, everyday tasks and simple exchanges on personal/immediate topics. |
| Intermediate Programme | III | B1 | Independent English — the learner copes with most everyday situations, expresses opinions, and narrates experience with reasonable fluency. |
| Upper Intermediate Programme | IV | B2 | Fluent general + emerging academic/professional English — the learner argues a position, follows extended discourse, and begins producing structured academic/professional text. |
| Advanced Programme | V | C1 | Academic and professional fluency — the learner operates effectively in study and work contexts, with flexible, precise, well-structured language. |
| English Mastery Programme | VI | C2 | Near-native command — the learner expresses themselves spontaneously, precisely, and persuasively across virtually any context, including leadership and public communication. |

Progression requirement at every level: a passing score on the
end-of-level examination (see each level's Assessment Strategy below)
across all four skills plus a grammar/vocabulary component. A learner
who does not pass repeats the relevant modules, not the whole level
from zero — see § Assessment design principles.

---

## Assessment design principles (apply to every level)

- **Placement test** (taken once, pre-Level I): a graded four-skills
  screening (listening, reading, short written response, brief spoken
  interview) that places a learner into their appropriate level rather
  than assuming every learner starts at Foundation.
- **Unit quizzes**: short, objective (multiple-choice/gap-fill),
  auto-gradable — exactly what `submitQuizAttempt()`
  (`functions/_lib/lms/content.js`) already scores server-side.
- **Skills assessments** (per module or small group of modules):
  listening comprehension, reading comprehension, a speaking task
  (recorded or live, rubric-graded), a writing task (rubric-graded).
- **End-of-level examination**: all four skills plus a
  grammar/vocabulary paper, weighted toward the level's stated
  competencies (e.g. Foundation weights survival-task listening/
  speaking heavily; Advanced weights academic writing and extended
  discourse heavily).
- **Progression requirement**: a defined pass threshold per component
  (not one blended score) — a learner strong in writing but weak in
  speaking should be told specifically what to revise, not given a
  single opaque number. Real numeric thresholds are a Milestone 2+
  academic-policy decision (see `docs/lms-architecture.md`'s
  `lms_pass_threshold`, currently a mechanism default, not a
  published academic standard) — this document defines *what* is
  assessed and *how it's structured*, not the exact cut score, which
  stays your call.

---

## Level I — Foundation Programme (A1)

*Built out to full lesson-by-lesson depth in
`docs/curriculum-level-1-foundation.md`. What follows is this level's
framework; the companion document is the worked example.*

**Overview.** The learner arrives with little or no English. By the
end of Foundation, they can introduce themselves, handle short
everyday exchanges (shopping, ordering food, asking directions, basic
scheduling), read and write short simple texts, and understand slow,
clear speech on familiar topics.

**Learning objectives (can-do).** By the end of Level I, the learner
can: introduce themselves and others; ask/answer simple personal
questions; describe their home, family, and daily routine in simple
sentences; make simple purchases and requests; tell the time and
discuss simple schedules; ask for and give basic directions; write a
short personal message or form; understand short, simple spoken
instructions given slowly and clearly.

**Thematic modules (10, ~12 learning units each):**
1. Meeting People — greetings, introductions, personal information
2. Everyday Objects & Places — classroom/home/city vocabulary, `there is/are`
3. Family & Routines — present simple, daily routine, telling the time
4. Food & Shopping — countable/uncountable nouns, `some/any`, prices
5. Around Town — directions, prepositions of place, imperatives
6. Describing People & Things — `to be`, adjectives, possessives
7. Past Experiences (Simple Past I) — regular/irregular verbs, simple narration
8. Plans & Abilities — `can`, `going to`, simple future
9. Health & Feelings — `have/has`, basic health vocabulary, giving simple advice
10. Review & Consolidation — cumulative revision, Foundation-level mock exam

**Grammar progression.** Present simple (be/have/do); articles (a/an/the);
plurals; demonstratives; possessive adjectives/`'s`; personal/object
pronouns; `there is/are`; prepositions of place and time; countable/
uncountable nouns and quantifiers (some/any/a lot of); imperatives;
adjectives and comparatives (simple); `can` for ability; `going to`
for near future; simple past (regular and common irregular verbs);
basic question formation (wh-questions, yes/no questions).

**Vocabulary progression.** ~750-800 headwords across: personal
information, family, numbers/time/dates, home and classroom objects,
food and shopping, town and directions, daily routine verbs, basic
adjectives (size, colour, feeling), simple health vocabulary. Frequency-
banded (highest-utility everyday words first), not alphabetical.

**Pronunciation focus.** The English alphabet and phonemic awareness;
word stress in common everyday words; basic sentence stress and
rhythm; the `/θ/`/`/ð/` sounds (th-); final `-s`/`-es` and `-ed`
pronunciation patterns.

**Skills foci.**
- *Listening*: slow, clear, scripted audio on familiar topics; number/
  time/price recognition; simple instructions.
- *Speaking*: highly scaffolded dialogues, role-plays with models
  provided, short prepared self-introductions.
- *Reading*: short signs, simple forms, short simple paragraphs with
  high-frequency vocabulary.
- *Writing*: filling in forms, short simple sentences, a short personal
  message (postcard/text-message length).

**Functional / academic / professional English.** Functional only at
this level: greetings and small talk, polite requests, simple
transactional language (shops, cafés, transport). No academic or
professional English component yet — introduced from Level III onward
(see below).

**Critical thinking / public speaking.** Not yet introduced formally —
Foundation's cognitive load is on basic accuracy and confidence; a
1-minute prepared self-introduction "speech" at the end of the level is
the only public-speaking element, deliberately light.

**Assessment strategy.** 10 unit quizzes (one per module); 3 skills
checkpoints (after modules 3, 6, 9) covering listening/speaking/
reading/writing lightly; end-of-level examination covering all four
skills plus grammar/vocabulary, weighted toward listening and speaking
survival tasks.

**Revision units.** Module 10 is wholly revision + mock exam. Modules
3, 6, 9 each open with a 1-unit cumulative review before introducing
new material.

**Mastery outcomes.** A Level I graduate can survive and communicate
minimally in an English-speaking environment for essential daily needs
— the CEFR A1 "breakthrough" descriptor, applied to WEC-LC's own
scope and sequence.

---

## Level II — Elementary Programme (A2)

**Overview.** The learner builds from survival phrases to handling
routine tasks and simple social exchange — describing experiences,
expressing simple opinions, and managing everyday situations with more
independence.

**Learning objectives (can-do).** By the end of Level II, the learner
can: describe past experiences and events in simple terms; express
likes, dislikes, and simple opinions; make and respond to invitations,
suggestions, and apologies; describe future plans and intentions;
compare people, places, and things; give simple reasons and
explanations; handle simple phone/service conversations; write short
connected texts (a short email, a simple description, a short story).

**Thematic modules (10):**
1. Life Stories — past simple/continuous, biography basics
2. Travel & Transport — comparatives/superlatives, travel vocabulary
3. Work & Study — present continuous for current activity, jobs/routines
4. Likes, Dislikes & Opinions — gerunds, `like/love/hate + -ing`, simple opinion language
5. Making Plans — future forms review, invitations/suggestions/arrangements
6. Homes & Neighbourhoods — there was/were, describing places, prepositions review
7. Food, Health & Habits — frequency adverbs, `should/shouldn't`, lifestyle vocabulary
8. Shopping & Services — past simple questions, complaints/requests, money vocabulary
9. Telling Stories — sequencing language (first, then, after that), simple past narration
10. Review & Consolidation — cumulative revision, Elementary-level mock exam

**Grammar progression.** Past simple and past continuous; `used to`;
comparatives/superlatives; present continuous for current/temporary
action vs. present simple for habit; future forms review (will/going
to/present continuous for arrangements); modals for advice/obligation
(`should`, `have to`, `must/mustn't`); gerunds after certain verbs;
`there was/were`; adverbs of frequency and manner; basic
first-conditional sentences; question tags (recognition).

**Vocabulary progression.** ~800-900 new headwords (running total
~1,600): travel and transport, jobs and workplaces, opinions and
feelings (expanded), homes and neighbourhoods, health and lifestyle,
shopping and services, storytelling/sequencing language.

**Pronunciation focus.** Weak forms in connected speech (was/were,
to, of); past-tense `-ed` endings (three sounds); intonation for
questions vs. statements; linking sounds between words.

**Skills foci.**
- *Listening*: everyday conversations at near-natural (slightly
  slowed) pace; short narratives; simple phone calls/announcements.
- *Speaking*: less-scaffolded role-plays, opinion exchanges,
  short narrated personal stories.
- *Reading*: short articles, simple stories, service/travel texts
  (schedules, menus, simple instructions).
- *Writing*: short connected paragraphs, a simple email, a short
  narrative with sequencing language.

**Functional / academic / professional English.** Functional English
expands (service transactions, invitations, simple complaints); still
no formal academic/professional module — the register step-up begins
at Level III.

**Critical thinking / public speaking.** A short (1-2 minute) prepared
narrative talk ("describe a memorable trip/event") with simple Q&A —
first exposure to responding to unscripted follow-up questions.

**Assessment strategy.** 10 unit quizzes; 3 skills checkpoints;
end-of-level examination across all four skills plus grammar/
vocabulary, weighted toward narrative speaking/writing and everyday
listening comprehension.

**Revision units.** Same pattern as Level I: Module 10 wholly revision
+ mock exam; cumulative review units at modules 3/6/9.

**Mastery outcomes.** A Level II graduate manages routine social and
practical tasks independently and can narrate simple past experience —
the CEFR A2 "waystage" descriptor, applied to WEC-LC's scope.

---

## Level III — Intermediate Programme (B1)

**Overview.** The learner becomes a genuinely independent user —
coping with most travel/work/study situations, expressing and
defending opinions, and beginning structured, purposeful writing. This
is also where **academic English begins**, introduced deliberately
early rather than left until Advanced.

**Executive Decision note:** Level III carries the full A2→B1
transition in one level rather than a separate Pre-Intermediate
programme tier (see § Executive Decision above). In practice this
means Level III's early modules (roughly modules 1-3, once authored to
full depth) should deliberately open at a lower-B1/upper-A2 register
— consolidating and lightly extending Level II's A2 output — before
modules 4 onward move firmly into independent B1 territory and the
academic-English strand described below. This is a sequencing note for
Level III's own authoring pass, not a change to this document's
existing 10-module list, which already opens with a present-perfect-
and-experience-narration module suited to that transition.

**Learning objectives (can-do).** By the end of Level III, the learner
can: describe experiences, hopes, and ambitions with reasons; give a
structured opinion and respond to a counter-opinion; write a
structured paragraph/short essay with a clear topic sentence; handle
unscripted, moderately complex conversations on familiar and some
unfamiliar topics; understand the main points of clear standard input
on work, school, or leisure; produce simple connected text on familiar
topics; ask clarifying questions to manage a conversation.

**Thematic modules (10):**
1. Present Perfect & Life Experience — present perfect vs. past simple, experience narration
2. Education & Learning — academic vocabulary I, note-taking basics, university-life context
3. Work, Careers & Entrepreneurship — conditionals I (zero/first), workplace and start-up vocabulary, first structured presentation task
4. Opinions & Debate — expressing/justifying opinion, agreeing/disagreeing formally, structured debate, leadership as a discussion theme
5. Environment, Ethics & Global Citizenship — passive voice I, issue-based vocabulary, environmental/global-citizenship/contemporary-issues context
6. Technology & Media — reported speech I, media/technology vocabulary, media-literacy and inference focus
7. Health, Body & Mind — modals of deduction (must/might/can't), health register, healthcare context
8. Travel & Culture — second conditional, cultural-comparison language, intercultural-communication focus
9. Academic Foundations — paragraph structure, topic sentences, basic citation awareness, consolidated presentation/note-taking/summarising practice
10. Review & Consolidation — cumulative revision, Intermediate-level mock exam

**Executive Directive note (elevated skill set):** per your Level III
directive, every module above weaves in — proportionate to the
module's theme, not mechanically forced into each lesson — extended
authentic-style reading with inference (not just literal
comprehension) questions; structured writing building toward
paragraph/short-essay coherence; discourse markers taught explicitly
as a functional set (not left implicit); phrasal verbs, collocations,
and idiomatic language flagged the same deliberate way Level II
flagged BrE/AmE differences; note-taking, summarising, and paraphrasing
as recurring, explicitly practised sub-skills (formally introduced in
Module 2, reused and extended from Module 3 onward); at least one
genuine presentation task per module from Module 3 onward; pronunciation
work that targets fluency and intelligibility (connected speech,
stress/rhythm, attitude-carrying intonation) rather than isolated
accuracy drilling alone; and intercultural communication as a running
thread, not confined to Module 8. This is the same "curriculum
evolves, mechanism stays consistent" principle applied at Levels I→II,
now applied at Level II→III.

**AI-readiness design intent (not a build instruction):** Level III's
assignments are authored with the same structured `instructions +
rubric` shape used since Level I, and that shape is deliberately kept
machine-legible (named, weighted rubric criteria; explicit task
elements) so that a future AI learning assistant could plausibly
pre-score a draft against the same rubric a human instructor uses,
without requiring a schema change. This is a design property of how
content is authored, not a new LMS feature — no AI-scoring code is
built as part of this curriculum pass; see `docs/lms-architecture.md`
for the standing "curriculum drives platform" principle that governs
when a feature like that would actually get built.

**Grammar progression.** Present perfect simple (vs. past simple);
present perfect continuous (introduction); zero and first conditionals;
second conditional (introduction); passive voice (present/past
simple); reported speech (statements); modals of deduction and
possibility; relative clauses (defining); `used to`/`would` for past
habit (review + extension); linking words for cause/effect/contrast
(because, so, although, however).

**Vocabulary progression.** ~900-1,000 new headwords (running total
~2,500-2,600): education and learning, work and careers, opinion/
argument language, environment and society, technology and media,
health register, travel and culture, academic connective language.

**Pronunciation focus.** Sentence stress for emphasis and contrast;
intonation for expressing opinion/uncertainty; connected speech
(elision, assimilation) at conversational pace; minimal-pair
discrimination for commonly confused sounds.

**Skills foci.**
- *Listening*: natural-pace conversations, short lectures/talks,
  podcasts/interviews on familiar topics.
- *Speaking*: structured opinion-giving, agree/disagree discussion,
  a short prepared talk with unscripted Q&A.
- *Reading*: articles, short reports, opinion pieces — identifying
  main idea vs. supporting detail.
- *Writing*: structured paragraphs, a short opinion essay (thesis +
  2 supporting points + conclusion), an informal-to-semiformal email.

**Functional / academic / professional English.** **Academic English
begins here**: paragraph structure, topic sentences, basic note-taking,
and awareness that sources should be acknowledged (full citation
mechanics deferred to Level IV+). **Professional English** introduced
lightly: workplace vocabulary, semiformal email register.

**Critical thinking / public speaking.** A structured 2-3 minute
opinion talk (state a position, give two reasons, respond to one
challenge question) — the first explicit "argue a position" task in
the programme.

**Assessment strategy.** 10 unit quizzes; 3 skills checkpoints;
end-of-level examination across all four skills plus grammar/
vocabulary, now including a graded short opinion-essay writing
component and a structured spoken-opinion component, each rubric-
assessed (see § Assessment design principles).

**Revision units.** Same pattern; Module 10 wholly revision + mock
exam.

**Mastery outcomes.** A Level III graduate is an independent user who
can maintain interaction, express and justify opinions, and produce
simple structured text — the CEFR B1 "threshold" descriptor, applied
to WEC-LC's scope.

---

## Level IV — Upper Intermediate Programme (B2)

**Overview.** The learner becomes fluent enough to follow extended
discourse, argue a position in depth, and produce genuinely
structured academic and professional writing. This level carries the
heaviest step-up in register and complexity in the programme.

**Learning objectives (can-do).** By the end of Level IV, the learner
can: understand extended speech and complex argumentation on
familiar and abstract topics; interact with a degree of fluency that
makes regular interaction with native speakers possible without strain
on either party; produce clear, detailed text on a wide range of
subjects; explain a viewpoint, weighing advantages/disadvantages; write
a structured 4-5 paragraph essay with a clear thesis and evidence;
participate in a structured meeting/seminar-style discussion; write a
professional email/report in an appropriate register.

**Thematic modules (10):**
1. Advanced Present & Past Systems — present perfect continuous, past perfect, mixed-tense narration
2. Academic Writing I — thesis statements, essay structure (5-paragraph), paraphrasing
3. The World of Work — conditionals II (third), professional email/report register
4. Arguing a Position — advanced agree/disagree, concession language, debate structure
5. Science, Technology & Ethics — passive voice II, reported speech II, abstract-topic vocabulary
6. Global Issues — modals for speculation, nominalisation (intro), issue-based discussion
7. Media Literacy & Critical Reading — identifying bias/tone, inference, advanced reading strategies
8. Meetings & Negotiation — polite disagreement, negotiation language, meeting register
9. Academic Writing II — synthesising two sources, basic citation mechanics, coherence/cohesion devices
10. Review & Consolidation — cumulative revision, Upper Intermediate-level mock exam

**Grammar progression.** Past perfect (simple and continuous); mixed
conditionals (introduction); third conditional; passive voice
(all major tenses); reported speech (questions, commands, advanced
reporting verbs); modals of speculation/certainty (must have, might
have, can't have); relative clauses (defining and non-defining);
nominalisation (introduction, for academic register); advanced
linking/cohesion devices (moreover, nevertheless, consequently); ellipsis
and substitution for cohesion.

**Vocabulary progression.** ~1,000-1,100 new headwords (running total
~3,500-3,700): abstract/academic vocabulary, professional/business
register, global-issues vocabulary, media and argumentation
vocabulary, negotiation and meeting language, academic connective/
hedging language (arguably, it could be suggested that).

**Pronunciation focus.** Stress patterns in longer academic/abstract
words; intonation for nuance (sarcasm, hedging, emphasis); managing
pace and pausing for extended spoken turns; register-appropriate
delivery (formal vs. informal tone).

**Skills foci.**
- *Listening*: lectures, debates, news analysis, extended interviews —
  identifying argument structure, not just content.
- *Speaking*: structured debate, seminar-style discussion, a 4-5
  minute presentation with visual support and Q&A.
- *Reading*: opinion journalism, academic-adjacent articles, identifying
  bias, tone, and implicit argument.
- *Writing*: a full structured essay (thesis, 3 body paragraphs with
  evidence, conclusion), a professional email/report, source
  paraphrase without plagiarism.

**Functional / academic / professional English.** Both tracks are now
substantial and explicit: **Academic English** — essay architecture,
paraphrasing, basic citation, coherence devices. **Professional
communication** — email/report register, meeting participation,
negotiation language, polite disagreement.

**Critical thinking / public speaking.** A 4-5 minute structured
presentation (with visual aids) on an assigned or chosen topic,
including handling unscripted audience questions, and a graded
participation component in at least one structured debate.

**Assessment strategy.** 10 unit quizzes; 3 skills checkpoints; end-of-
level examination across all four skills plus grammar/vocabulary,
including a full rubric-graded essay and a rubric-graded presentation
with live/recorded Q&A.

**Revision units.** Same pattern; Module 10 wholly revision + mock
exam.

**Mastery outcomes.** A Level IV graduate operates with fluency and
spontaneity in most academic/professional/social contexts and produces
well-structured extended text — the CEFR B2 "vantage" descriptor,
applied to WEC-LC's scope.

**Executive Academic Objective (elevated standard):** per your Level
IV directive, this level marks the transition from independent
communication to confident academic and professional English — by the
end of it, a learner should be able to function in universities,
international workplaces, business environments, and multicultural
settings using English as their primary language. The step-up is
**not** simply harder grammar: every module raises intellectual depth,
communicative sophistication, and academic/professional expectation.
Concretely: analytical reading of authentic-style texts (adapted
newspaper/magazine/academic-article/business/policy/speech/opinion
registers) with explicit analysis of author's purpose, bias, argument
structure, evidence, rhetorical technique, and implicit meaning;
evidence-based discussion and persuasive speaking as standing
expectations, not occasional activities; and eight distinct
**academic/professional writing genres** distributed deliberately
across the level rather than repeating one essay format ten times —
reflective writing (Module 1), the argumentative essay (Module 2),
formal correspondence and a workplace proposal (Module 3),
compare-and-contrast writing (Module 5), an analytical report/policy
proposal (Module 6), a summary-and-critique (Module 7), meeting
minutes and a negotiation follow-up email (Module 8), and
research-based writing synthesising supplied source material with
basic citation mechanics (Module 9, the level's capstone). Speaking
work is similarly varied across the level by design: a job interview
(Module 3), structured debate (Module 4), a panel discussion (Module
5), a formal 4-5 minute presentation with visual-aid support and
unscripted Q&A (Module 6, the level's flagship public-speaking task),
and negotiation/meeting participation (Module 8) — deliberately
covering formal presentations, panel discussions, debate, interviews,
negotiation, and meetings across the level rather than only one
speaking format. Every module requires learners to evaluate evidence,
compare viewpoints, justify a conclusion, identify an assumption, and
defend an argument respectfully — critical thinking as a standing
requirement of the module's core task, not a bolt-on discussion
question.

**AI-readiness (continued, not a build instruction):** as with Level
III, every rubric in this level is authored as named, weighted,
machine-legible criteria so that future AI tutoring, writing feedback,
pronunciation coaching, and adaptive-pathway recommendation could
plausibly integrate against the same rubric a human instructor uses,
without rewriting the curriculum. This remains a design property of
how content is authored — no AI-assessment code is introduced in this
curriculum pass; see `docs/lms-architecture.md`'s "curriculum drives
platform" principle for when such a feature would actually get built.

---

## Level V — Advanced Programme (C1)

**Overview.** The learner refines fluency into precision — flexible,
effective language use for social, academic, and professional purposes,
including implicit meaning, nuance, and stylistic control.

**Learning objectives (can-do).** By the end of Level V, the learner
can: understand a wide range of demanding, longer texts and recognise
implicit meaning; express ideas fluently and spontaneously without
much obvious searching for expression; use language flexibly and
effectively for social, academic, and professional purposes; produce
clear, well-structured, detailed text on complex subjects, controlling
organisational patterns and cohesive devices; understand and produce
nuanced, idiomatic, register-appropriate language; lead a discussion
or negotiation to a productive outcome.

**Thematic modules (10):**
1. Nuance & Idiom — idiomatic expression, collocation, register-shifting practice
2. Academic Writing III — literature-review style synthesis, advanced citation, argument structuring
3. Leadership & Persuasion — persuasive rhetoric, advanced negotiation, framing language
4. Complex Systems (Science, Economics, Policy) — advanced nominalisation, technical register, hedging/qualifying claims
5. Cross-Cultural Communication — pragmatics, politeness strategies, register across cultures
6. Advanced Media & Discourse Analysis — analysing rhetorical strategy, subtext, and bias at depth
7. Research & Presentation — structuring a research-informed presentation, Q&A facilitation
8. Professional Advocacy — case-building, structured argument under challenge, formal debate
9. Style & Voice — varying register/tone for audience and purpose, editing for concision and precision
10. Review & Consolidation — cumulative revision, Advanced-level mock exam

**Grammar progression.** Full conditional range in combination (mixed
conditionals at will); advanced modality (nuanced degrees of certainty,
formality, and politeness); inversion for emphasis (Rarely have I...,
Not only did...); advanced passive and nominalised academic
constructions; cleft sentences (It was ... that / What ... is);
discourse markers for complex argument structuring; advanced ellipsis,
substitution, and cohesion at paragraph/essay level.

**Vocabulary progression.** ~1,100-1,200 new headwords (running total
~4,600-4,900): idiomatic and collocational language, advanced academic
and technical register (science/economics/policy as vehicles, not the
subject itself), rhetorical and persuasive vocabulary, cross-cultural
pragmatics vocabulary, editorial/stylistic vocabulary.

**Pronunciation focus.** Full command of connected speech features at
natural speed; register-shifting delivery (formal lecture vs.
informal aside); managing stress/intonation for rhetorical effect
(persuasion, emphasis, irony).

**Skills foci.**
- *Listening*: unscripted native-paced discourse — debates, academic
  lectures, negotiations — extracting implicit meaning and stance.
- *Speaking*: leading a discussion/negotiation to an outcome,
  persuasive argument under challenge, a 6-8 minute research-informed
  presentation.
- *Reading*: dense, demanding texts (policy documents, academic-style
  articles, opinion/analysis pieces) — extracting nuance and implicit
  argument.
- *Writing*: an extended, source-synthesising piece (research-informed
  essay/report) with advanced citation and cohesion; editing one's own
  writing for register, concision, and precision.

**Functional / academic / professional English.** Fully integrated at
this level rather than a separate strand: academic synthesis writing,
professional advocacy/negotiation, and leadership communication are
the level's core content, not an add-on.

**Critical thinking / public speaking.** A 6-8 minute research-informed
presentation with structured Q&A, and a formal debate or negotiation
simulation assessed on both argument quality and delivery.

**Assessment strategy.** 10 unit quizzes; 3 skills checkpoints;
end-of-level examination across all four skills plus grammar/
vocabulary, including a full rubric-graded extended written piece and
a rubric-graded presentation/negotiation simulation.

**Revision units.** Same pattern; Module 10 wholly revision + mock
exam.

**Mastery outcomes.** A Level V graduate uses English flexibly,
precisely, and effectively across academic, professional, and social
registers, recognising implicit meaning and nuance — the CEFR C1
"effective operational proficiency" descriptor, applied to WEC-LC's
scope.

**Executive Academic Objective (elevated standard):** per your Level V
directive, learners are no longer treated as language learners alone
— they begin functioning as academics, professionals, executives,
researchers, entrepreneurs, and global communicators who use English
naturally, precisely, and confidently, operating in demanding
academic, professional, corporate, governmental, diplomatic, and
international environments. This moves beyond language competence
into **intellectual communication**: critical analysis, academic
argumentation, synthesis of multiple viewpoints, research
communication, executive communication, strategic thinking, persuasive
and leadership communication, intercultural negotiation, and policy
discussion — developed as the level's core content, not an add-on to
grammar practice.

Concretely: **analytical reading** of sophisticated authentic-style
texts (adapted journal articles, research summaries, policy papers,
think-tank reports, business analyses, speeches, editorials, long-form
journalism) requiring learners to evaluate methodology, argument
quality, assumptions, evidence, credibility, rhetorical strategy,
bias, and implications — a further step beyond Level IV's purpose/
bias/tone/technique analysis into genuine critical evaluation of how
well an argument is actually made. **Ten distinct advanced writing
genres**, distributed deliberately across the level's nine content
modules so each is taught for its own real communicative purpose:
professional documentation (Module 1), a literature review (Module
2), a position paper (Module 3), a policy brief (Module 4), an
analytical paper (Module 5), a persuasive article (Module 6), a
research essay and a conference abstract (Module 7), a strategic
proposal (Module 8), and an executive report (Module 9). **A varied
executive/professional speaking programme**, similarly distributed:
a leadership speech and negotiation (Module 3), a stakeholder meeting
(Module 4), intercultural negotiation (Module 5), a media interview
(Module 6), the flagship 6-8 minute conference presentation with Q&A
facilitation (Module 7), a crisis-communication simulation and panel
discussion under challenge (Module 8), and an executive briefing
(Module 9) — deliberately covering the range of high-stakes real-world
speaking situations named in the directive, not one format repeated.
Every module requires learners to evaluate evidence, compare
viewpoints, justify conclusions, identify assumptions, solve realistic
problems, and defend arguments respectfully, at a genuinely
C1 level of sophistication.

**AI-readiness (continued, not a build instruction):** as with Levels
III-IV, every rubric in this level is authored as named, weighted,
machine-legible criteria so that future AI tutoring, writing feedback,
pronunciation coaching, adaptive revision, and personalised learning
could plausibly integrate against the same rubric a human instructor
uses, without rewriting the curriculum. This remains a design property
of how content is authored — no AI-assessment code is introduced in
this curriculum pass; see `docs/lms-architecture.md`'s "curriculum
drives platform" principle for when such a feature would actually get
built.

**Distinctive WEC-LC identity:** per your directive, Level V does not
imitate any single existing English programme. Its module sequence
(idiom/register → academic synthesis → leadership/persuasion →
technical/policy register → cross-cultural pragmatics → media/
discourse analysis → research presentation → professional advocacy →
style/voice mastery → consolidation) is a deliberately WEC-LC-authored
progression from precision of language to precision of thought,
designed so every module leaves learners better prepared for
universities, executive careers, entrepreneurship, and international
collaboration — the level's stated measure of success, alongside (not
instead of) linguistic accuracy.

---

## Level VI — English Mastery Programme (C2)

**Overview.** The capstone level. The learner refines toward
near-native command: spontaneous, precise, and persuasive across
virtually any register or context, capable of leading, teaching, and
representing an organisation in English at the highest level.

**Learning objectives (can-do).** By the end of Level VI, the learner
can: understand with ease virtually everything heard or read;
summarise information from different spoken and written sources,
reconstructing arguments and accounts coherently; express themselves
spontaneously, very fluently, and precisely, differentiating finer
shades of meaning even in complex situations; produce publication-
quality written work; represent a position or organisation
persuasively at a senior/leadership level; mentor or coach another
learner's English development, demonstrating command of the language
as a system, not just as a skill.

**Thematic modules (10):**
1. Mastery Diagnostic & Executive Leadership — diagnostic assessment, personalised focus areas, subjunctive/high-formal register
2. Diplomacy & International Relations — diplomatic hedging, extreme-formality register, negotiation at state/institutional level
3. Global Business Strategy — complex inversion and fronting for strategic emphasis, boardroom register
4. Public Policy — modality of obligation and recommendation, policy-analysis register
5. Law & Justice — legal-reasoning precision, defined terms, conditional structures in legal discourse
6. Innovation & Emerging Technologies — speculative and hypothetical register, future-in-the-past, technical-to-general translation
7. Media & Public Communication — rhetorical devices at scale, crisis leadership communication, media register
8. Research & Scholarship — academic metadiscourse and hedging at publication standard
9. Ethics & Responsible Leadership — concessive-conditional and moral-reasoning register, chairing deliberation
10. Capstone: Global Challenges & Sustainable Development, and the Mastery Examination — integrated capstone project, professional portfolio, oral defence, six-level reflective analysis

**Executive Academic Objective (capstone standard).** Per your Level
VI directive, this level is *the capstone of the WEC-LC academic
journey* — mastery, not merely proficiency. Graduates should use
English naturally and effectively in the highest academic,
professional, executive, governmental, legal, diplomatic, media,
research, and international contexts. The ten modules above were
**deliberately re-themed** from this document's original Level VI
draft (which organised by *communication mode* — academic discourse,
publication writing, rhetoric, media) to organise instead by
**professional domain**, matching the ten capstone themes named in
your directive. The pedagogical spine of the original design is
preserved intact — an entry diagnostic (Module 1), a keynote-scale
public-speaking demand (Module 6), a media/crisis simulation (Module
7), and a substantial capstone project with oral defence and mastery
examination (Module 10) — but the *content vehicle* for each is now a
genuine professional domain rather than a skill category. This is a
recorded curriculum revision, made because a C2 learner is no longer
practising communication modes in the abstract: at mastery level, the
domain *is* the difficulty, and register mastery is only demonstrable
inside a real professional field.

Ten distinct publication-quality **writing genres** are distributed
one per module: a reflective leadership essay (M1), strategic
recommendations (M2), an executive report (M3), a policy analysis
(M4), a scholarly critique (M5), a grant/project proposal (M6), an
opinion editorial (M7), a research paper (M8), a conference paper
(M9), and a professional portfolio integrating the level's work (M10).
Nine high-level **speaking formats** are similarly distributed: an
executive briefing (M1), a diplomatic negotiation (M2), a boardroom
presentation (M3), a policy panel discussion (M4), oral defence of a
complex argument (M5), a keynote address (M6), a media interview and
crisis leadership statement (M7), a conference presentation (M8), a
chaired ethical deliberation (M9), and the capstone presentation with
sustained questioning (M10).

**AI-readiness (continued, not a build instruction):** as at Levels
III-V, every rubric is authored as named, weighted, machine-legible
criteria, so future AI tutoring, writing feedback, pronunciation
coaching, and adaptive revision could integrate against the same
rubric a human instructor uses. No AI-assessment code is introduced by
this curriculum pass.

**Grammar and vocabulary.** By Level VI, grammar instruction is no
longer sequential/new-item-driven — the learner already commands the
full system. Focus shifts to **precision, style, and register
control**: eliminating residual first-language interference patterns,
mastering rare/formal constructions (subjunctive mood, complex
inversion, formal hedging), and vocabulary work becomes **domain-
driven** — each module supplies the specialist terminology of its own
professional field (diplomatic, strategic, policy, legal, technical,
media, scholarly, ethical), and the learner's capstone (Module 10)
concentrates on whichever of those domains their own project and
career direction require. (Running total through Level V: ~4,600-4,900
headwords; Level VI adds domain-specific sets rather than a fixed
programme-wide figure — a deliberate, disclosed departure from the
fixed-headword-list model used in Levels I-V, appropriate to a
capstone/mastery level where vocabulary is selected by professional
purpose, not sequenced by frequency.)

**Pronunciation focus.** Full native-like command of connected speech,
stress, and intonation; refining any residual first-language accent
features that affect intelligibility or register perception (not
eliminating accent — WEC-LC does not treat "sounding native" as the
goal, only full intelligibility and register control).

**Skills foci.** All four skills operate at a near-native ceiling by
this level; the module sequence above focuses each skill through a
real, substantial output (a capstone project, a public-facing
presentation, a publication-quality written piece) rather than more
skill-isolated practice.

**Functional / academic / professional English.** Fully mastered and
integrated; this level's actual content *is* advanced academic,
professional, and diplomatic register, applied to real, substantial
learner-directed work.

**Critical thinking / public speaking.** The level's spine: a keynote
address (module 6), a media interview and crisis leadership statement
(module 7), a chaired ethical deliberation (module 9), and the
capstone presentation with sustained questioning and oral defence
(module 10) — the most sustained public-communication demand in the
programme.

**Assessment strategy.** Diagnostic at entry (module 1) informing a
personalised focus plan carried through the level, alongside the
standard unit-quiz sequence retained for consistency with Levels I-V;
a substantial capstone project (proposal, draft, final submission,
presentation, oral defence) assessed by detailed rubric; a
professional portfolio assembling the level's ten written genres; and
a comprehensive mastery examination covering all four skills at C2
depth, including a reflective analysis of the learner's development
across all six levels.

**Revision units.** Module 1 functions as both diagnostic and
personalised-revision-planning; module 10 combines final revision with
the mastery examination itself.

**Mastery outcomes.** A Level VI graduate operates in English at a
level indistinguishable in practice from an educated native speaker
for academic, professional, diplomatic, and leadership purposes — the
CEFR C2 "mastery" descriptor, applied to WEC-LC's scope, and the
programme's terminal, publishable outcome: a WEC-LC IEFC certificate
of completion (see `docs/lms-architecture.md`'s Milestone roadmap for
the certificate/transcript workflow this will eventually issue
against).

---

## What this document is, and isn't

**Is:** a complete, six-level curriculum architecture — objectives,
CEFR alignment, thematic module sequencing, grammar/vocabulary
progression, skills foci, and assessment strategy for every level of
the already-published IEFC programme. Every claim in it is either an
already-confirmed public fact (level count, CEFR labels, pricing,
duration) or WEC-LC's own original curriculum design, written for this
programme specifically — not copied from, or claimed to be certified
by, any external examination board or publisher.

**Also is, now:** lesson-by-lesson content for **all six levels**.
When this section was first written, only Level I was built out to
full depth, and this paragraph honestly recorded that the remaining
five levels did not yet exist. They now do. Every level is authored to
the same standard, seeded into the live LMS schema, and verified
end-to-end:

| Level | CEFR | Index document | Per-module documents | Seed | Test sweep |
|---|---|---|---|---|---|
| I | A1 | `docs/curriculum-level-1-foundation.md` | `docs/curriculum/level-1/` | `sql/seed-curriculum-level-1.sql` | `tests/curriculum-level-1.test.mjs` + `tests/curriculum-level-1-complete.test.mjs` |
| II | A2 | `docs/curriculum-level-2-elementary.md` | `docs/curriculum/level-2/` | `sql/seed-curriculum-level-2.sql` | `tests/curriculum-level-2.test.mjs` |
| III | B1 | `docs/curriculum-level-3-intermediate.md` | `docs/curriculum/level-3/` | `sql/seed-curriculum-level-3.sql` | `tests/curriculum-level-3.test.mjs` |
| IV | B2 | `docs/curriculum-level-4-upper-intermediate.md` | `docs/curriculum/level-4/` | `sql/seed-curriculum-level-4.sql` | `tests/curriculum-level-4.test.mjs` |
| V | C1 | `docs/curriculum-level-5-advanced.md` | `docs/curriculum/level-5/` | `sql/seed-curriculum-level-5.sql` | `tests/curriculum-level-5.test.mjs` |
| VI | C2 | `docs/curriculum-level-6-mastery.md` | `docs/curriculum/level-6/` | `sql/seed-curriculum-level-6.sql` | `tests/curriculum-level-6.test.mjs` |

Totals across the six levels: **60 modules, 294 learning items, 60
quizzes (642 questions), and 60 rubric-graded assignments.**

**Isn't, and is not intended to be:** an external accreditation, an
equivalence claim against any named examination board or publisher, or
a substitute for the trained instructors who deliver it. Every lesson
in this programme is written for classroom delivery by a teacher; the
LMS carries the content, the assessment mechanics, and the progress
record, but nothing in it claims to replace instruction.

**Isn't, yet:** Milestone 2's LMS content-authoring tooling — an
in-app editor, question banks, and a rubric-grading interface for
staff. Curriculum content currently reaches the platform through
reviewed SQL seed files rather than a UI. That was a deliberate
sequencing choice ("curriculum first"), and it remains the correct
one: the authoring tool should be built to fit a curriculum that
exists, not the reverse. See `docs/lms-architecture.md`.

A full academic review of the completed six-level programme —
sequencing, repetition, gaps, and assessment — is in
`docs/curriculum-programme-review.md`.
