# AIPC — Level II: Elementary Programme (A2) — Full Curriculum

*Companion to `docs/curriculum-framework.md` and
`docs/curriculum-level-1-foundation.md` (Level I, the process this
level continues). Written to your standing instruction that curriculum
should "evolve in depth and sophistication rather than simply
repeating the Level I template" — see § What's different from Level I
below for exactly how this level answers that, module by module.*

---

## What's different from Level I, and why

Level I built pure mechanical accuracy from zero — every lesson
assumed no prior English. Level II assumes a real foundation and is
built accordingly:

- **Linguistic complexity increases deliberately.** Where Level I
  taught one structure per lesson in isolation, Level II regularly
  contrasts two related structures against each other in the same
  lesson (past simple vs. past continuous; present simple vs. present
  continuous) — the core A2 skill is choosing the *right* structure for
  a context, not just forming one correctly.
- **British/American English is introduced explicitly, not silently
  assumed.** Every module includes a short "BrE / AmE" note wherever a
  genuine, useful difference exists (vocabulary, spelling, or a
  grammar preference) — flagged, never presented as one being
  "correct" and the other "wrong." AIPC teaches International
  English; recognising both major varieties is part of that, not an
  edge case.
- **Contexts are authentic and contemporary, not just grammatically
  convenient.** Tasks are framed around real situations a global
  learner actually has — booking travel through an app, messaging a
  colleague, comparing subscription services — described generically
  (no real named company is used or implied to endorse AIPC; see
  `docs/editorial-bible.md`'s standing discipline against fabricating
  institutional facts, applied here to mean: authentic *scenario*
  framing, never a fabricated *partnership* or *real brand* claim).
- **Critical thinking, not just accuracy, is assessed.** Speaking
  activities now regularly include a discussion or opinion-justifying
  element ("Which is better, and why?"), not only guided practice of a
  target form — a genuine, if modest, first step toward the
  communicative-competence assessment your directive asks for. Full
  open-ended communicative assessment (a human judging a real
  conversation) matters more at this level than at Level I, where
  simple accuracy checks were developmentally appropriate; the
  auto-gradable quiz format stays multiple-choice (a real, current
  limitation of `quiz_questions`' schema — see
  `docs/lms-architecture.md`'s roadmap for richer item types as a
  candidate future LMS enhancement) but assignments now more often ask
  for justified opinions and connected discourse, not just correct
  forms.

**Same as Level I, unchanged:** the lesson template's required
elements (objectives, prerequisite knowledge, warm-up, presentation,
guided/independent practice, all four skills, pronunciation,
vocabulary, formative assessment, homework, revision, extension), the
seed-file-into-live-schema pipeline, and full end-to-end LMS
verification for every module. Consistency in *mechanism* matters as
much as growth in *content* — a student moving from Level I to Level
II should feel the material get richer, not the platform get less
reliable.

---

## Level II module map

| # | Module | Can-do focus | Key grammar | Key vocabulary | Full module document |
|---|---|---|---|---|---|
| 1 | Life Stories | Narrate past experiences, distinguishing background from key events; describe past habits/states | past simple vs. past continuous, `used to` | biography/life-event vocabulary, time-sequencing connectors | *below, in this document* |
| 2 | Travel & Transport | Compare travel options and justify a choice | comparatives/superlatives | travel, transport, booking vocabulary | `docs/curriculum/level-2/module-02-travel-transport.md` |
| 3 | Work & Study | Describe current work/study activity vs. routine; discuss ambitions | present continuous (current) vs. present simple (habit) | jobs, workplace, study vocabulary | `docs/curriculum/level-2/module-03-work-study.md` |
| 4 | Likes, Dislikes & Opinions | Express and justify preferences; agree/disagree politely | gerunds after opinion verbs, `prefer...to...`, `would rather` | opinion/preference language | `docs/curriculum/level-2/module-04-likes-dislikes-opinions.md` |
| 5 | Making Plans | Make, accept, and decline invitations/arrangements | `will` vs. `going to` vs. present continuous (future) | invitations, arrangements | `docs/curriculum/level-2/module-05-making-plans.md` |
| 6 | Homes & Neighbourhoods | Describe past and present homes/places; weigh advantages/disadvantages | `there was/were`, `used to be`, prepositions review | housing, neighbourhood vocabulary | `docs/curriculum/level-2/module-06-homes-neighbourhoods.md` |
| 7 | Food, Health & Habits | Discuss habits and give lifestyle advice at different strengths | frequency adverbs, `should/shouldn't` (extended) | lifestyle, health vocabulary | `docs/curriculum/level-2/module-07-food-health-habits.md` |
| 8 | Shopping & Services | Handle a service problem or complaint | past simple questions (fact-finding sequences), complaint language | shopping, services, money vocabulary | `docs/curriculum/level-2/module-08-shopping-services.md` |
| 9 | Telling Stories | Narrate a sequenced past story with connectors, a hook, and a resolution | sequencing connectors, past simple/continuous combined | storytelling connectors | `docs/curriculum/level-2/module-09-telling-stories.md` |
| 10 | Review & Consolidation | Consolidate all Level II outcomes; Elementary-level mock exam | cumulative review | cumulative review | `docs/curriculum/level-2/module-10-review-consolidation.md` |

**Level II is now complete** — all 10 modules built to full
publication-quality depth and seeded into the live schema via
`sql/seed-curriculum-level-2.sql`, verified end-to-end by
`tests/curriculum-level-2.test.mjs` (84 assertions: every module loads
with a reading/quiz/assignment, every quiz's own seeded correct
answers score 100% when submitted, no quiz ever leaks its answer key
to the client, every assignment can be submitted and staff-graded, and
a weak attempt correctly fails).

---

## Module 1: Life Stories — full build

### Module overview

Module 1 makes the single most important A2 grammar leap: distinguishing
**background** (what was happening / what used to be true) from
**events** (what happened) in a narrative. This is the real
communicative skill behind "past simple vs. past continuous vs. used
to" — not three isolated rules, but one coherent way of telling a
story so a listener can follow what mattered.

**Module learning objectives.** By the end of Module 1, the learner
can: narrate a sequence of past events using simple past; describe
what was happening at a specific past moment using past continuous;
correctly combine both in one sentence (`when/while`); describe past
habits and states that are no longer true using `used to`; ask
someone about their life story and follow up with clarifying
questions.

**Content map (5 learning items):** module overview & key phrases;
Lesson 1.1 ("What Were You Doing? — Past Simple vs. Past
Continuous"); Lesson 1.2 ("I Used To... — Life Before and Now");
Module 1 Quiz (10 questions); Module 1 Assignment ("My Life Story —
Then and Now").

---

### Reference reading: Module overview & key phrases

**Key phrases introduced this module:** I was ...-ing when... — While
I was..., I... — I used to.../I didn't use to... — What was your life
like when you were a child? — That's really interesting — tell me
more.

**BrE / AmE note (introductory, general):** from this level onward,
spelling differences appear across vocabulary (British *favourite,
colour, travelled*; American *favorite, color, traveled*). AIPC
materials use British spelling as the house style (matching the
`.co.uk` domain and UK-headquartered brand), but both are entirely
correct, standard English, and learners should be able to recognise
either in something they read or hear. This module's texts and audio
model British spelling/pronunciation; later modules flag specific
vocabulary differences as they arise.

**Key vocabulary previewed:** life-event nouns (childhood, career,
marriage, graduation), sequencing/narrative connectors (when, while,
during, at that time), `used to` -relevant lifestyle-change vocabulary
(move, change, grow up).

---

### Lesson 1.1 — "What Were You Doing? — Past Simple vs. Past Continuous"

**Learning objectives.** By the end of this lesson you can: (1) form
past continuous correctly (`was/were + -ing`); (2) choose correctly
between simple past (a completed event) and past continuous
(background action in progress); (3) combine both correctly in one
sentence with `when` or `while`; (4) ask `What were you doing
when...?` and answer appropriately.

**Prerequisite knowledge.** Level I, Module 7 (simple past, regular
and irregular).

**Warm-up (5 min).** Instructor tells a short real anecdote using both
tenses ("I was making coffee this morning when my phone rang") and
asks learners to identify which action was "in progress" (background)
and which one "interrupted" it — pure noticing before any rule is
named.

**Presentation (10 min).** Model: "I was walking home when I saw an
old friend. While I was waiting for the bus, it started to rain."
Highlight on the board: past continuous = the "background," ongoing at
a moment; simple past = the single completed event, often one that
interrupts the background action. `when` typically introduces the
interrupting simple-past event; `while` typically introduces the
background past-continuous action — genuinely useful, not absolute,
patterns worth stating as tendencies rather than hard rules (a
linguistically honest nuance appropriate to flag even at A2).

**Guided practice (10 min).** Pair work: learners are given 6
sentence-halves (3 past-continuous "background" halves, 3 simple-past
"event" halves) and match them into 3 logical combined sentences using
`when`/`while`.

**Independent practice (10 min).** Learners write 4 original sentences
about real memories using the target pattern, then interview a partner:
"What were you doing when [a shared, appropriate reference point —
e.g. a recent public holiday, a well-known local event] happened?"

**Speaking activity.** The partner interview above, followed by a
short whole-class share of 2-3 answers — a first, light exposure to
listening and responding to multiple classmates' extended answers, not
just a single partner's.

**Critical thinking / discussion prompt.** "Do you think it's easier
to remember what you were *doing* at an important moment, or exactly
*when* it happened? Why?" — a genuine, open opinion question with no
single correct answer, discussed briefly in pairs before feeding back
one idea each to the class.

**Listening activity (5 min).** Listen to a short narrated anecdote (5
sentences, mixing both tenses) and identify which actions were
"background" and which were "events" on a simple worksheet.

**Reading activity (5 min).** Read a short "Where were you when...?"
style short biographical paragraph and answer 3 comprehension
questions distinguishing background from event.

**Writing task (5 min).** Write a short paragraph (4-5 sentences)
about a real memory, using at least 2 past continuous and 2 simple
past verbs correctly combined.

**Pronunciation practice (5 min).** Drill weak-form `was/were` in
connected speech (`I was WALKing` — stress on the main verb, not the
auxiliary) versus the stressed form in short answers ("Yes, I WAS").

**Vocabulary reinforcement.** A "life moments" picture set (a wedding,
a graduation, a house move) used to elicit both target tenses in
context.

**Formative assessment.** Instructor checks correct tense selection
(not just correct formation) during independent practice — the real
target skill this lesson builds.

**Homework.** Learners prepare one real "What was I doing when...?"
story (3-4 sentences) to share at the start of Lesson 1.2.

**Revision.** Lesson 1.2 opens with 2-3 learners sharing their
homework story as a warm-up.

**Extension activity.** Stronger learners add a third clause using
`during` ("During the storm, while I was walking home, I saw an old
friend") — a light preview of more complex multi-clause narration,
developed further in Level III.

---

### Lesson 1.2 — "I Used To... — Life Before and Now"

**Learning objectives.** By the end of this lesson you can: (1) use
`used to + base verb` correctly for past habits/states that are no
longer true; (2) form the negative (`didn't use to`) and question
(`Did you use to...?`) correctly; (3) contrast `used to` (repeated
past habit/state) with simple past (a single completed action); (4)
describe your own life "then and now" with reasonable fluency.

**Prerequisite knowledge.** Lesson 1.1 (past narration), Level I,
Module 3 (present simple, as the "now" contrast point).

**Warm-up (5 min).** Instructor states one real true "used to"
sentence about themselves as a child ("I used to be afraid of dogs")
and one that's still true now, asking learners to guess which is
which before the form is presented.

**Presentation (10 min).** Model: "I used to live in a small town.
Now I live in a big city. I didn't use to like coffee, but now I love
it." Highlight: `used to` is for a repeated habit or a state that
was once true and now isn't — never for a single completed action
(explicitly contrast: "I used to visit my grandmother every summer"
[habit, correct] vs. ~~"I used to visit her last year"~~ [single
event, needs simple past instead] — a genuinely common A2 error,
worth naming directly).

**Guided practice (10 min).** Pair work: learners are given 6 "then"
prompts (a childhood habit/state) and build `used to` sentences,
then add a contrasting "now" sentence using present simple for each.

**Independent practice (10 min).** Learners complete a "Then and Now"
worksheet about their own real lives (4 rows: home, hobby, opinion/
taste, daily habit), then interview a partner and note one interesting
"then and now" fact about them to share with the class.

**Speaking activity.** The "Then and Now" partner interview above.

**Critical thinking / discussion prompt.** "Is it usually good or bad
when people change a lot over time? Can you think of an example of a
change that was positive, and one that was difficult?" — discussed in
small groups, genuinely open, encouraging learners to justify a
personal view rather than recite a fact.

**Listening activity (5 min).** Listen to someone describing their
life "then and now" (6 sentences) and complete a simple two-column
(then/now) worksheet.

**Reading activity (5 min).** Read a short "How I've Changed" blog-
style text and answer 3 comprehension questions distinguishing past
habit from present fact.

**Writing task (5 min).** Write a short "Then and Now" paragraph (5-6
sentences) about your own real life, using `used to` correctly at
least 3 times and present simple for the "now" contrast.

**Pronunciation practice (5 min).** Drill the connected-speech
reduction of `used to` /ˈjuːstə/ (distinct from the full-form `use`
/juːz/, a genuine, useful A2 minimal-pair-of-meaning point since the
two are spelled similarly but pronounced and used very differently).

**Vocabulary reinforcement.** "Then vs. Now" vocabulary sort (words
likely to describe change: bigger, quieter, busier, different) feeding
forward lightly into Module 2's comparatives.

**Formative assessment.** Instructor checks the used-to/simple-past
distinction specifically (the lesson's core target error) during
independent practice.

**Homework.** Learners finalise their "Then and Now" write-up for
Module 1's assignment, adding at least one more true detail.

**Revision.** This lesson opens with the Lesson 1.1 homework-story
recap. Module 1's Quiz and Assignment draw on both lessons.

**Extension activity.** Stronger learners add one sentence using
`would` as an alternative to `used to` for a repeated past action only
(not a state) — flagged as a genuine, useful nuance: `would` works for
repeated actions ("I would visit every summer") but not for states
("~~I would live in a small town~~" is wrong; `used to live` is
required) — an accuracy point worth previewing here and returning to
at Level III.

---

## Module 1 Quiz (auto-graded, 10 questions)

*Seeded verbatim into `quiz_questions` — see
`sql/seed-curriculum-level-2.sql`. Answer key marked with ✓.*

1. "I ___ TV when the phone rang." — (a) watched (b) was watching ✓
   (c) watch (d) am watching
2. "While I ___ dinner, my sister called." — (a) cooked (b) was
   cooking ✓ (c) cook (d) cooks
3. "___ you use to live in London?" — (a) Did ✓ (b) Do (c) Were (d)
   Was
4. "I didn't use to ___ coffee, but now I love it." — (a) liked (b)
   liking (c) like ✓ (d) likes
5. Which sentence is correct? — (a) I used to visit her last year. (b)
   I visited her last year. ✓ (c) I use to visited her last year. (d)
   I was visiting her last year only.
6. "When I ___ the door, I saw my friend outside." — (a) was opening
   (b) opened ✓ (c) open (d) opens
7. "___ were you doing at 8pm yesterday?" — (a) What ✓ (b) When (c)
   Where (d) Who
8. Which describes a repeated past habit, not a single event? — (a) I
   went to Paris in 2019. (b) I used to go to the cinema every Friday.
   ✓ (c) I was watching TV at 9pm. (d) I saw a great film last night.
9. "She ___ shy when she was a child, but now she's very confident." —
   (a) use to be (b) used to being (c) used to be ✓ (d) was use to be
10. Which word often introduces the "background" action in a past
    narrative? — (a) when (b) while ✓ (c) then (d) after

---

## Module 1 Assignment — "My Life Story — Then and Now"

**Instructions given to the learner:** Write (or record) 8-10
sentences telling the story of one meaningful change in your life.
Include: at least one sentence combining past continuous and simple
past with `when`/`while`; at least two sentences using `used to` to
describe how things were before; a clear present-simple contrast
showing how things are now; and one sentence explaining, in your own
words, why this change mattered to you — a genuine reflection, not
just a list of facts.

**Grading rubric (for the instructor):**
- **Grammatical accuracy** — correct past continuous/simple past
  combination, correct `used to` formation and appropriate use (habit/
  state, not single event).
- **Vocabulary range** — at least 4 distinct life-event or
  change-related words used correctly.
- **Task completion** — all required grammar elements and the personal
  reflection sentence present.
- **Communicative quality** *(new emphasis at this level)* — does the
  story actually communicate a clear, followable narrative with a
  genuine personal reflection, not just correctly formed but
  disconnected sentences? This is the single most important criterion
  at A2 and should weigh at least as heavily as grammatical accuracy.

A grade at or above the platform's pass threshold marks Module 1
completed for the learner.
