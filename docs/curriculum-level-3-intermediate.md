# AIPC — Level III: Intermediate Programme (B1) — Full Curriculum

*Companion to `docs/curriculum-framework.md` (see its Level III
section for the module map, grammar/vocabulary progression, and the
Executive Directive note this build implements) and
`docs/curriculum-level-2-elementary.md` (Level II, the process this
level continues). Written to your standing instruction that this level
represents "an important academic transition" — learners are "no
longer simply learning English... they are becoming independent users
of the language." See § What's different from Level II below for
exactly how this build answers that, module by module.*

---

## What's different from Level II, and why

Level II took Level I's isolated grammar and put it to real
communicative work in connected discourse. Level III goes further:
learners are no longer just completing exchanges — they are
maintaining extended interaction, defending a position, and producing
structured written text. Concretely, this level adds:

- **Extended reading with inference, not just literal comprehension.**
  Where Level II's reading activities checked "what does the text
  say," Level III regularly asks "what does the text imply, and how do
  you know" — a genuine B1 reading skill, introduced explicitly rather
  than assumed.
- **Structured writing toward paragraph and short-essay coherence.**
  Writing tasks build deliberately toward a topic sentence + supporting
  detail + conclusion shape (formalised in Module 9, but seeded from
  Module 1 onward), using discourse markers as connective tissue rather
  than a list of correct but disconnected sentences.
- **Discourse markers taught as an explicit functional set.** Every
  module introduces a small, purposeful set (e.g. *in fact, however,
  as a result, on the other hand*) tied to the module's own
  communicative function — argument, contrast, sequence, or
  consequence — the same deliberate, flagged treatment Level II gave
  BrE/AmE vocabulary.
- **Phrasal verbs, collocations, and idiomatic language, flagged
  explicitly.** Natural English is built from multi-word chunks, not
  just single headwords; each module now names a small set of
  genuinely useful phrasal verbs and collocations tied to its theme,
  rather than leaving them to be picked up incidentally.
- **Note-taking, summarising, and paraphrasing as recurring, explicitly
  practised sub-skills.** Formally introduced in Module 2 (note-taking
  from a short talk), then reused as a standing listening/reading
  technique for the rest of the level, with summarising and
  paraphrasing added as distinct writing sub-skills from Module 3
  onward.
- **A genuine presentation task, from Module 3 onward.** Not every
  lesson, but at least once per module from Module 3 — a short
  prepared talk with unscripted follow-up questions, the first
  sustained monologic speaking task in the programme (Level II's
  storytelling module was the immediate precursor; Level III makes it
  a structured, recurring public-speaking skill).
- **Pronunciation for fluency and intelligibility, not just accuracy.**
  Level III's pronunciation work targets connected speech (linking,
  elision), sentence stress/rhythm across longer utterances, and
  intonation that carries attitude (doubt, emphasis, contrast) — the
  sound of someone speaking fluently, not just correctly.
- **Intercultural communication as a running thread.** Present from
  Module 1 (whose life-experience norms are being described), not
  confined to the Travel & Culture module alone.
- **Authentic, contemporary contexts throughout.** University life,
  workplace communication and entrepreneurship, technology and media,
  healthcare, global citizenship, leadership, environmental awareness,
  ethics, and contemporary international issues are woven into the
  module themes below — generic, realistic framing per
  `docs/editorial-bible.md`'s standing discipline (no fabricated real
  organisation, partnership, or statistic is ever implied).
- **Functional grammar.** Every grammar point is taught tied to what it
  *does* communicatively (the passive voice to de-emphasise an unknown
  or unimportant agent in a report; reported speech to relay what
  someone said in a workplace or media context) rather than as an
  abstract rule practised in isolation.

**Same as Levels I-II, unchanged:** the lesson template's required
elements (objectives, prerequisite knowledge, warm-up, presentation,
guided/independent practice, all four skills, pronunciation,
vocabulary, formative assessment, homework, revision, extension), the
seed-file-into-live-schema pipeline, and full end-to-end LMS
verification for every module. Assignment rubrics keep Level II's
"communicative quality" criterion and add a new one, **discourse
coherence & register** — does the writing hang together with
appropriate connectors, and is the register right for the task
(a workplace email is not a personal diary entry)?

**On AI integration.** Per your directive, lessons are authored so
that a future AI learning assistant *could* coach pronunciation,
provide conversational practice, assess writing against the published
rubric, and recommend revision — this shapes how content is written
(named, weighted, machine-legible rubric criteria; explicit task
elements; consistent structure) but is a design property, not a build
instruction. No AI-assessment code is introduced in this curriculum
pass; see `docs/curriculum-framework.md`'s Level III section and
`docs/lms-architecture.md`'s "curriculum drives platform" principle for
when such a feature would actually get built.

---

## Level III module map

| # | Module | Can-do focus | Key grammar | Authentic context | Full module document |
|---|---|---|---|---|---|
| 1 | Present Perfect & Life Experience | Narrate life experiences with reasons; distinguish unspecified experience from a specific past moment | present perfect (experience) vs. past simple | personal/global life-experience narratives | *below, in this document* |
| 2 | Education & Learning | Discuss learning and study habits; take structured notes from a short talk | academic vocabulary I, note-taking basics | university life | `docs/curriculum/level-3/module-02-education-learning.md` |
| 3 | Work, Careers & Entrepreneurship | Discuss careers, workplace routines, and business ideas; give a short prepared talk | zero/first conditionals | workplace communication, entrepreneurship, leadership | `docs/curriculum/level-3/module-03-work-careers-entrepreneurship.md` |
| 4 | Opinions & Debate | Express and defend an opinion; formally agree/disagree; hold a structured debate | opinion/agreement structures, formal register | debate, leadership as a discussion theme | `docs/curriculum/level-3/module-04-opinions-debate.md` |
| 5 | Environment, Ethics & Global Citizenship | Discuss issues using the passive voice; weigh an ethical dilemma | passive voice (present/past simple) | environment, global citizenship, contemporary issues | `docs/curriculum/level-3/module-05-environment-ethics-global-citizenship.md` |
| 6 | Technology & Media | Relay what someone said or reported; evaluate a media claim critically | reported speech (statements) | technology, media literacy | `docs/curriculum/level-3/module-06-technology-media.md` |
| 7 | Health, Body & Mind | Speculate and deduce about health situations; discuss wellbeing | modals of deduction (must/might/can't) | healthcare | `docs/curriculum/level-3/module-07-health-body-mind.md` |
| 8 | Travel & Culture | Discuss hypothetical situations; compare cultural norms respectfully | second conditional | travel, intercultural communication | `docs/curriculum/level-3/module-08-travel-culture.md` |
| 9 | Academic Foundations | Structure a paragraph/short essay; acknowledge a source; give a longer prepared talk | paragraph structure, topic sentences, basic citation awareness | academic/professional writing | `docs/curriculum/level-3/module-09-academic-foundations.md` |
| 10 | Review & Consolidation | Consolidate all Level III outcomes; Intermediate-level mock exam | cumulative review | cumulative review | `docs/curriculum/level-3/module-10-review-consolidation.md` |

**Level III is now complete** — all 10 modules built to full
publication-quality depth and seeded into the live schema via
`sql/seed-curriculum-level-3.sql`, verified end-to-end by
`tests/curriculum-level-3.test.mjs` (84 assertions: every module loads
with a reading/quiz/assignment, every quiz's own seeded correct
answers score 100% when submitted, no quiz ever leaks its answer key
to the client, every assignment can be submitted and staff-graded, and
a weak attempt correctly fails).

---

## Module 1: Present Perfect & Life Experience — full build

### Module overview

Module 1 makes the defining B1 grammar leap: separating **experience**
(what has happened at some unspecified point in your life — present
perfect) from **event** (what happened at a specific, known past
moment — simple past). This single distinction underlies one of the
most natural patterns in real conversation — "Have you ever...?"
followed by "Yes — I [did it] in/when..." — and this module teaches
that pattern as a connected two-part skill, not two isolated grammar
rules.

**Module learning objectives.** By the end of Module 1, the learner
can: ask and answer about life experiences using present perfect
correctly; follow up an experience question with specific past-simple
detail once a specific time is mentioned or implied; briefly explain
*why* an experience mattered, not just report that it happened; use a
small set of discourse markers (*in fact, actually*) to add emphasis
or detail to a narrated experience; recognise 3-4 genuinely useful
phrasal verbs/collocations tied to this module's theme.

**Content map (5 learning items):** module overview & key phrases;
Lesson 1.1 ("Have You Ever...? — Present Perfect for Experience");
Lesson 1.2 ("I Went There in 2019 — Present Perfect vs. Past Simple in
Conversation"); Module 1 Quiz (10 questions); Module 1 Assignment ("A
Life Experience That Changed My Perspective").

---

### Reference reading: Module overview & key phrases

**Key phrases introduced this module:** Have you ever...? — I've
never... — I have, actually — In fact,.../As a matter of fact,... —
That's/It's had a real impact on me. — Looking back, I think...

**Discourse markers this module (functional set — adding emphasis or
detail):** *in fact*, *actually*, *as a matter of fact* — all used to
add a stronger or more specific detail to a statement someone has just
made ("I've travelled a lot. In fact, I've visited over ten
countries."). Distinguished from Level II's simpler connectors:
these don't sequence events, they intensify or specify a claim.

**Phrasal verbs & collocations this module:** *grow up* (spend your
childhood somewhere), *look back on [something]* (think about a past
experience, often reflectively), *get used to [something]* (become
familiar/comfortable with something over time — recycling Level II's
`used to`, now as a distinct, easily confused phrasal pattern worth
contrasting directly), *broaden your horizons* (gain wider experience/
perspective), *make a lasting impression* (have a memorable, long-term
effect on someone).

**BrE / AmE note:** the present perfect itself is used somewhat more
in British English than American English in everyday speech (British
speakers often prefer "I've just eaten" where American speakers often
say "I just ate," both entirely correct within their own variety); the
clearest concrete difference is the past participle of *get*: British
English uses **got** ("I've got better at this"), American English
commonly uses **gotten** ("I've gotten better at this") for the
"become/improve" meaning — both correct, genuinely one of the most
noticeable grammatical (not just vocabulary) BrE/AmE differences
learners will encounter.

**Key vocabulary previewed:** experience-related nouns (achievement,
milestone, turning point, perspective), reflection language (I
realised, it taught me, looking back), intercultural note: what counts
as a "big" life experience varies by culture and personal circumstance
— worth naming before the speaking activities below, so no learner
feels their real experiences are "too small" to share.

---

### Lesson 1.1 — "Have You Ever...? — Present Perfect for Experience"

**Learning objectives.** By the end of this lesson you can: (1) form
present perfect correctly (`have/has + past participle`) including
common irregular participles; (2) ask `Have you ever...?` questions
and answer with `I have/I haven't (ever)...`; (3) use present perfect
specifically for unspecified-time life experience, not a single
completed action; (4) add a brief reason or reaction to an experience
answer, not just a bare "yes/no."

**Prerequisite knowledge.** Level II, Module 1 (past simple narration);
Level I, Module 7 (irregular past participles overlap partly with
irregular past simple forms, worth flagging as a source of confusion).

**Warm-up (5 min).** Instructor asks the class 3 rapid `Have you
ever...?` questions (tried a specific food, visited a specific kind of
place, learned a specific skill) and takes a quick show-of-hands count
before formal presentation — pure noticing of the question pattern.

**Presentation (10 min).** Model: "Have you ever visited another
country? — Yes, I have. I've visited several, actually. Have you ever
tried surfing? — No, I haven't, but I'd like to." Highlight explicitly:
present perfect here reports *that* something has happened at some
point, with no specific time attached — the moment a specific time is
named, the conversation naturally shifts to past simple (previewed
here, taught fully in Lesson 1.2).

**Guided practice (10 min).** Pair work: learners are given 8
"Have you ever...?" prompt cards spanning a deliberately broad
range of experience types (travel, food, skills, achievements,
minor mishaps) and interview each other, noting yes/no answers.

**Independent practice (10 min).** Learners write 5 real
`Have you ever...?` questions of their own (not from the prompt cards)
and interview a new partner, this time requiring the partner to add
one sentence of reaction or reason to every "yes" answer ("Yes, I
have — it was one of the best weeks of my life").

**Speaking activity.** The independent-practice interview above, with
2-3 learners sharing their most interesting finding about their
partner with the whole class — this level's slightly larger listening
audience (previewed in Level II Module 1, now a standing expectation).

**Critical thinking / discussion prompt.** "Do you think it matters
more *what* experiences someone has had, or *how* they think and talk
about those experiences afterwards? Why?" — a genuinely open B1-level
question connecting the grammar (reporting experience) to a real
reflective judgement, with no single correct answer.

**Listening activity (5 min).** Listen to a short interview (6-7
exchanges) in which someone is asked about their life experiences and
identify which questions use present perfect and which shift to past
simple once a specific time is mentioned.

**Reading activity — extended reading & inference (8 min).** Read a
short first-person reflection (120-150 words) about a formative life
experience. Answer 2 literal comprehension questions and 2 **inference**
questions specifically ("The writer doesn't say this directly, but
what can you infer about how they felt beforehand? What evidence in
the text supports your answer?") — this lesson's first explicit,
named inference task, modelling the "what does the text imply, and how
do you know" skill this level introduces.

**Writing task (5 min).** Write 4-5 present perfect sentences about
your own real experiences, then rewrite one of them adding a specific
time and switching correctly to past simple, showing you understand
both forms and when each applies.

**Pronunciation practice (5 min).** Drill the contracted, connected
form `'ve`/`'s` in natural speech ("I've been," "She's tried") versus
the full form used for emphasis or negation ("I HAVE been there" vs.
"I haven't"); also drill rising intonation on `Have you ever...?`
questions as genuinely curious (not interrogating) in tone — a fluency/
intelligibility point, not just formal accuracy.

**Vocabulary reinforcement.** A present-perfect experience "bingo" —
learners mingle to find a classmate who matches each experience square,
using the target question form and noting who found what.

**Formative assessment.** Instructor checks the core target error
(using past simple where present perfect is needed for unspecified-time
experience, and vice versa) during independent practice.

**Homework.** Learners choose their single most meaningful life
experience and jot down 4-5 rough notes about it (what, roughly when,
why it mattered), ready for Lesson 1.2.

**Revision.** Lesson 1.2 opens with learners briefly sharing their
homework notes in rough form.

**Extension activity.** Stronger learners add present perfect
continuous for an experience still relevant/ongoing ("I've been
learning Spanish for two years") as a recognition-level preview, not
formally taught until later in the level.

---

### Lesson 1.2 — "I Went There in 2019 — Present Perfect vs. Past Simple in Conversation"

**Learning objectives.** By the end of this lesson you can: (1)
correctly shift from present perfect to past simple once a specific
time is mentioned or asked for; (2) ask natural specific-time follow-up
questions (`When did you...? What was it like?`); (3) narrate a real
life experience as a short connected mini-story, combining both tenses
appropriately; (4) briefly explain the significance of an experience,
using `which is why` to connect a fact to its consequence.

**Prerequisite knowledge.** Lesson 1.1 (present perfect for
experience), Level II Module 9 (sequencing connectors and narrative
shape, now extended into a mixed-tense narrative).

**Warm-up (5 min).** Instructor tells a real "Have you ever...?"
answer about themselves, then has the class ask 3 specific-time
follow-up questions, modelling the natural experience → detail shift
before formal presentation.

**Presentation (10 min).** Model dialogue:
> A: Have you ever lived abroad?
> B: Yes, I have. I lived in Berlin for a year.
> A: Really? When did you go?
> B: I went in 2019, actually. It completely changed how I see my own
> country — which is why I'd recommend it to anyone.
Highlight the pattern explicitly: present perfect opens the topic
(experience, unspecified time); once a specific time is given or
asked for, the conversation moves to past simple for the specific
event and its details; `which is why` links a stated fact to a
personal consequence or opinion — a genuinely useful B1 connector for
turning a simple narrative into a reasoned reflection.

**Guided practice (10 min).** Pair work: Learner A shares a real
experience (from Lesson 1.1's homework notes) starting with present
perfect; Learner B asks at least 2 specific-time follow-up questions,
and Learner A answers in past simple with detail, then swap.

**Independent practice (10 min).** Learners write and then tell a
short (6-8 sentence) mini-story about their chosen experience,
correctly combining present perfect (the opening claim) and past
simple (the specific narrated detail), including one `which is why`
sentence connecting the experience to something it taught them or
changed about them.

**Speaking activity.** Learners tell their mini-story to a small
group, who ask at least one genuine follow-up question each — this
lesson's core task and the direct basis for Module 1's assignment.

**Critical thinking / discussion prompt.** "Is it possible for a small,
ordinary experience to matter just as much as a big, dramatic one?
Can you think of an example?" — deliberately reinforces the module
overview's intercultural/inclusivity note that "big" is relative, and
gives quieter learners a genuine, low-pressure entry point.

**Listening activity (5 min).** Listen to someone narrating a life
experience (8-9 sentences, mixing both tenses) and complete a simple
timeline/detail-grid worksheet.

**Reading activity (5 min).** Read a short "This changed how I see the
world" personal essay excerpt and identify: (a) the present-perfect
opening claim, (b) the past-simple specific detail, (c) the stated or
implied significance — a structural reading task previewing Module 9's
formal paragraph-structure work.

**Writing task (5 min).** Write your mini-story (from independent
practice) into a clean final short paragraph (6-8 sentences), checked
for correct present perfect/past simple shifts.

**Pronunciation practice (5 min).** Drill sentence stress for contrast
across a longer utterance — stressing the shift word itself
("I lived in Berlin for a YEAR" vs. "I've LIVED there") — a fluency
point about how stress placement signals which part of a sentence
carries new information, genuinely useful at conversational pace.

**Vocabulary reinforcement.** A "specific-time" vocabulary bank review
(in 2019, a few years ago, when I was younger, back then) matched
against the "unspecified-time" bank from Lesson 1.1 (ever, never, so
far, in my life).

**Formative assessment.** Instructor checks the tense-shift accuracy
and the presence of a genuine `which is why` (or equivalent)
significance statement during the speaking activity.

**Homework.** Learners finalise their mini-story into Module 1's
assignment format, adding at least one more true, specific detail.

**Revision.** This lesson opens with the Lesson 1.1 homework-notes
recap. Module 1's Quiz and Assignment draw on both lessons.

**Extension activity.** Stronger learners add a second `which is why`
sentence connecting a different consequence, and try substituting
`as a result` as an alternative connector with the same function.

---

## Module 1 Quiz (auto-graded, 10 questions)

*Seeded verbatim into `quiz_questions` — see
`sql/seed-curriculum-level-3.sql`. Answer key marked with ✓.*

1. "___ you ever visited another country?" — (a) Do (b) Did (c) Have
   ✓ (d) Are
2. "Yes, I ___. I've visited several." — (a) did (b) have ✓ (c) do (d)
   was
3. "I ___ to Berlin in 2019." (a specific time is given) — (a) have
   gone (b) went ✓ (c) have been (d) go
4. "When ___ you go?" — (a) have (b) did ✓ (c) do (d) has
5. "I've never ___ sushi." — (a) try (b) tried ✓ (c) tries (d) trying
6. Which sentence uses present perfect correctly for unspecified-time
   experience? — (a) I have visited Paris last year. (b) I have
   visited Paris. ✓ (c) I have visit Paris. (d) I visited Paris ever.
7. "I lived in Berlin for a year. ___, it changed how I see my own
   country." — (a) In fact (b) Which is why (c) It completely changed
   (d) actually ✓
8. "It taught me a lot about independence -- ___ I'd recommend it to
   anyone." — (a) in fact (b) which is why ✓ (c) actually (d) so far
9. In American English, the past participle of "get" (meaning
   "become/improve") is often: — (a) got (b) gotten ✓ (c) getting (d)
   get
10. Which phrase means "become familiar or comfortable with something
    over time"? — (a) grow up (b) look back on (c) get used to ✓ (d)
    make an impression

---

## Module 1 Assignment — "A Life Experience That Changed My Perspective"

**Instructions given to the learner:** Write (or record) a short,
connected account, 8-10 sentences, of one real life experience that
mattered to you. Structure it exactly as this module practised: open
with a present-perfect claim (what you have experienced); shift to
past simple for the specific time and detail; include at least one
discourse marker from this module (*in fact/actually/as a matter of
fact*); include at least one significance connector (*which is why/as
a result*) explaining why the experience mattered; and use at least
one phrasal verb or collocation from this module's list.

**Grading rubric (for the instructor):**
- **Grammatical accuracy** — correct present perfect formation and
  correct, appropriately timed shift to past simple.
- **Vocabulary range** — at least one discourse marker, one
  significance connector, and one phrasal verb/collocation from this
  module used correctly.
- **Task completion** — the experience is opened, narrated with
  specific detail, and its significance is explicitly stated.
- **Communicative quality** — is the reflection genuine and specific
  (not generic "it taught me a lot" with no real detail)?
- **Discourse coherence & register** *(new at this level)* — does the
  account read as one connected, logically ordered piece of writing
  (not a list of disconnected sentences), and is the register
  appropriate to a genuine personal reflection?

A grade at or above the platform's pass threshold marks Module 1
completed for the learner.
