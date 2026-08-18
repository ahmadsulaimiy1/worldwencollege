# WEC-LC — Level IV: Upper Intermediate Programme (B2) — Full Curriculum

*Companion to `docs/curriculum-framework.md` (see its Level IV
section for the module map, grammar/vocabulary progression, and the
Executive Academic Objective this build implements) and
`docs/curriculum-level-3-intermediate.md` (Level III, the process this
level continues). Written to your standing instruction that this level
represents "a significant transition from independent communication to
confident academic and professional English." See § What's different
from Level III below for exactly how this build answers that, module
by module.*

---

## What's different from Level III, and why

Level III made learners independent users who could argue, deduce, and
structure a paragraph. Level IV asks for something qualitatively
different: genuine academic and professional competence — the English
of a university seminar, a business meeting, a policy report. This is
**not** simply harder grammar layered onto the same tasks. Concretely:

- **Analytical reading, not just comprehension and inference.** Level
  III taught inference (what a text implies). Level IV adds explicit
  analysis of *author's purpose, bias, argument structure, evidence,
  rhetorical technique* — reading like a critical, evaluating adult,
  not just a comprehending student.
- **Eight distinct academic/professional writing genres, deliberately
  distributed.** Rather than one essay format repeated ten times, this
  level moves learners through reflective writing, the argumentative
  essay, formal correspondence, a workplace proposal,
  compare-and-contrast writing, an analytical report, a
  summary-and-critique, meeting minutes, and — as the level's capstone
  — research-based writing that synthesises two supplied source
  excerpts with basic citation mechanics. Each genre is taught for its
  own real communicative purpose, not as a generic "essay" wrapper.
- **A genuinely varied speaking programme.** A job interview, a
  structured debate, a panel discussion, a formal 4-5 minute
  presentation with visual-aid support and unscripted Q&A, and a
  negotiation/meeting roleplay — covering the range of real
  professional and academic speaking situations, not one format
  practised repeatedly.
- **Critical thinking as a standing task requirement, not a bolt-on
  question.** Every module's core task requires evaluating evidence,
  comparing viewpoints, identifying an assumption, and defending a
  conclusion — built into the task itself, not appended as an extra
  discussion prompt.
- **Cohesion and coherence devices, taught explicitly.** Level III
  taught individual discourse-marker families module by module. Level
  IV adds *nominalisation* (turning a verb/adjective into a noun for a
  more formal, academic register — "the company reduced emissions" →
  "the reduction of emissions by the company"), *ellipsis and
  substitution* (avoiding repetition across sentences), and a heavier,
  more formal connective register (*moreover, nevertheless,
  consequently*) — the texture of genuinely well-written academic and
  professional English, not just correct grammar.
- **Register awareness becomes explicit and load-bearing.** Every
  module distinguishes when formal, semi-formal, and informal register
  is appropriate — a professional email is not a personal reflection,
  a policy report is not a debate speech — and assignments are graded
  partly on whether the register matches the task.
- **Authentic, higher-stakes contexts.** Universities, international
  workplaces, business environments, and multicultural professional
  settings — the level's explicit destination, per your Executive
  Academic Objective — described generically (no fabricated real
  organisation, institution, or statistic is ever implied, per
  `docs/editorial-bible.md`'s standing discipline).

**Same as Levels I-III, unchanged:** the lesson template's required
elements (objectives, prerequisite knowledge, warm-up, presentation,
guided/independent practice, all four skills, pronunciation,
vocabulary, formative assessment, homework, revision, extension), the
seed-file-into-live-schema pipeline, and full end-to-end LMS
verification for every module. Assignment rubrics keep Level III's
"communicative quality" and "discourse coherence & register" criteria
and, where the genre calls for it, add **evidence & argument quality**
(is a claim actually supported, is a source acknowledged honestly, is
a counter-argument addressed) as a named rubric criterion — assessing
authentic performance, per your directive, rather than memorisation.

**On AI integration.** As at Level III, this level's rubrics are
authored as named, weighted, machine-legible criteria so a future AI
tutor could plausibly assist with feedback, pronunciation coaching, or
adaptive pathway recommendation against the same rubric an instructor
uses — a design property, not a build instruction. No AI-assessment
code is introduced in this curriculum pass.

---

## Level IV module map

| # | Module | Can-do focus | Key grammar | Writing genre / speaking format | Full module document |
|---|---|---|---|---|---|
| 1 | Advanced Present & Past Systems | Narrate complex, layered timelines; reflect on change over time | past perfect (simple/continuous), mixed-tense narration | reflective writing | *below, in this document* |
| 2 | Academic Writing I | Argue a thesis-driven position in structured, multi-paragraph form | thesis statements, 5-paragraph essay structure, paraphrasing | argumentative essay | `docs/curriculum/level-4/module-02-academic-writing-i.md` |
| 3 | The World of Work | Discuss hypothetical past outcomes; communicate professionally in writing and in a job interview | third conditional | formal correspondence + workplace proposal; job interview | `docs/curriculum/level-4/module-03-the-world-of-work.md` |
| 4 | Arguing a Position | Concede a point gracefully; hold a full structured debate | advanced agree/disagree, concession language | structured debate | `docs/curriculum/level-4/module-04-arguing-a-position.md` |
| 5 | Science, Technology & Ethics | Discuss abstract ethical/technological issues; relay complex reported claims | passive voice II, reported speech II | compare-and-contrast essay; panel discussion | `docs/curriculum/level-4/module-05-science-technology-ethics.md` |
| 6 | Global Issues | Speculate about causes/outcomes; brief an audience formally | modals for speculation, nominalisation (intro) | analytical report/proposal; flagship formal presentation with Q&A | `docs/curriculum/level-4/module-06-global-issues.md` |
| 7 | Media Literacy & Critical Reading | Analyse bias, tone, and rhetorical technique in authentic-style texts | advanced reading strategies (functional grammar) | summary-and-critique | `docs/curriculum/level-4/module-07-media-literacy-critical-reading.md` |
| 8 | Meetings & Negotiation | Disagree diplomatically; negotiate and participate in a meeting | polite-disagreement and negotiation language | negotiation roleplay; meeting minutes + follow-up email | `docs/curriculum/level-4/module-08-meetings-negotiation.md` |
| 9 | Academic Writing II | Synthesise multiple sources into one coherent argument, with citation | citation mechanics, cohesion/coherence devices | research-based writing from supplied sources (capstone) | `docs/curriculum/level-4/module-09-academic-writing-ii.md` |
| 10 | Review & Consolidation | Consolidate all Level IV outcomes; Upper Intermediate-level mock exam | cumulative review | cumulative review | `docs/curriculum/level-4/module-10-review-consolidation.md` |

**Level IV is now complete** — all 10 modules built to full
publication-quality depth and seeded into the live schema via
`sql/seed-curriculum-level-4.sql`, verified end-to-end by
`tests/curriculum-level-4.test.mjs` (84 assertions: every module loads
with a reading/quiz/assignment, every quiz's own seeded correct
answers score 100% when submitted, no quiz ever leaks its answer key
to the client, every assignment can be submitted and staff-graded, and
a weak attempt correctly fails). All eight distinct academic/
professional writing genres named in the Executive Academic
Objective — reflective writing, the argumentative essay, formal
correspondence/proposal, compare-and-contrast, a report/proposal, a
summary-and-critique, meeting minutes/follow-up email, and
research-based writing from supplied sources — are represented across
the ten modules, alongside a varied speaking programme (a job
interview, formal debate, a panel discussion, the flagship 4-5 minute
presentation with Q&A, and a negotiation roleplay).

---

## Module 1: Advanced Present & Past Systems — full build

### Module overview

Module 1 completes the programme's tense system: **past perfect**
(`had + past participle`) marks an event as happening *before* another
past event — the final piece needed for genuinely layered, adult
narration. Combined with everything already taught (present perfect
for experience, present perfect continuous for duration, past simple
for events, past continuous for background), learners can now narrate
a complex personal or professional timeline with real precision — the
foundation for this module's reflective-writing assignment, the
level's first of eight distinct writing genres.

**Module learning objectives.** By the end of Module 1, the learner
can: form past perfect simple and continuous correctly; use past
perfect to clarify the order of two past events; combine present
perfect, present perfect continuous, past simple, past continuous, and
past perfect fluently within one extended narrative; write a
reflective piece that genuinely traces change over time, not just a
list of events.

**Content map (5 learning items):** module overview & key phrases;
Lesson 1.1 ("I Had Already Left When... — Past Perfect, Simple &
Continuous"); Lesson 1.2 ("Looking Back — Mixed-Tense Narration &
Reflective Writing"); Module 1 Quiz (10 questions); Module 1
Assignment ("Looking Back — A Reflective Piece on Change").

---

### Reference reading: Module overview & key phrases

**Key phrases introduced this module:** By the time..., I had
already... — I'd been working there for... when... — Looking back,...
— In retrospect,... — Up until that point,... — Since then,...

**Discourse markers this module (functional set — reflective
temporal framing):** *looking back*, *in retrospect*, *up until that
point*, *since then* — used to frame a narrative explicitly as
reflection (viewed from the present, evaluating the past) rather than
simple chronological reporting, the defining feature of reflective
writing as a genre.

**Phrasal verbs & collocations this module:** *come a long way* (make
significant progress over time), *turn a corner* (reach a turning
point after a difficult period), *build on [a foundation]* (develop
further from an existing base), *move forward* (progress, often after
a setback), *take stock (of something)* (pause to assess a situation
carefully, often before deciding what's next).

**BrE / AmE note:** two formal-register vocabulary choices genuinely
worth knowing at this level: British **whilst** (a more formal,
literary variant of "while," common in British academic and
professional writing) is rarely used in American English, where
"while" covers both registers; similarly, British **amongst** vs.
American **among** — both correct, but American English strongly
prefers "among" in every register, while British formal writing uses
"amongst" more freely.

**Key vocabulary previewed:** change/growth vocabulary (milestone,
transition, turning point, progression, evolve), reflective-writing
connective language (this experience taught me, what I didn't realise
at the time, with hindsight). Intercultural note: how much personal
reflection or vulnerability is considered appropriate to share in
academic or professional writing varies by culture and institutional
norm; this module's reflective task is framed generically and the
learner chooses their own level of personal disclosure.

---

### Lesson 1.1 — "I Had Already Left When... — Past Perfect, Simple & Continuous"

**Learning objectives.** By the end of this lesson you can: (1) form
past perfect simple correctly (`had + past participle`); (2) form past
perfect continuous correctly (`had been + -ing`); (3) use past perfect
to clarify which of two past events happened first; (4) distinguish
past perfect simple (a completed earlier action) from past perfect
continuous (an ongoing earlier action, often with duration).

**Prerequisite knowledge.** Level II, Module 1 (past simple vs. past
continuous); Level III, Module 1 (present perfect simple); Level III,
Module 2 (present perfect continuous) — this lesson is the final piece
completing the full present/past tense system.

**Warm-up (5 min).** Instructor tells a short two-event story out of
order ("I arrived at the station. My train had already left.") and
asks learners which event happened first, before formal presentation
— surfacing the ordering problem past perfect solves.

**Presentation (10 min).** Model: "By the time I arrived, the meeting
had already started. I'd been working there for two years when the
company was acquired." Highlight explicitly: past perfect simple marks
a completed action before another past point (`had already started`);
past perfect continuous marks an action in progress up to that past
point, often with `for`/`since` duration (`I'd been working there for
two years`). Contrast directly with simple past for the *later*
event in each sentence, making the two-past-tense relationship
visually and logically explicit.

**Guided practice (10 min).** Learners are given 8 pairs of simple
sentences describing two related past events and combine each pair
into one sentence using past perfect for the earlier event and simple
past for the later one, choosing simple or continuous as appropriate.

**Independent practice (10 min).** Learners write 5 sentences about
real two-event sequences from their own life or work (a job that
ended before another began, a skill learned before it was needed),
correctly using past perfect, then explain the sequence to a partner,
who confirms they understood which event happened first.

**Speaking activity.** The partner explanation exchange above,
followed by a short whole-class share of one especially clear
"earlier event, later event" example per pair.

**Critical thinking / discussion prompt.** "Why do you think the order
events are told in a story doesn't always match the order they
actually happened? Can you think of a story (a film, a book, a real
account) that deliberately told events out of order? What effect did
that have?" — a genuinely sophisticated B2 question connecting the
grammar's function to real narrative technique.

**Listening activity (5 min).** Listen to a short account with two
past events told out of chronological order (6-7 sentences, mixing
past perfect and past simple) and reconstruct the actual chronological
order on a simple timeline worksheet.

**Reading activity — extended reading & analysis (8 min).** Read a
short professional/academic-style narrative (150-180 words) using past
perfect to establish a complex timeline. Answer 2 literal questions
and 2 analytical questions ("Which event does the writer present as
most significant, and how does the sentence structure — not just the
content — signal that?").

**Writing task (5 min).** Write 4-5 sentences describing a real
two-stage sequence from your own life (something that had already
happened before something else began), using past perfect correctly.

**Pronunciation practice (5 min).** Drill the contracted, connected
form `'d` for `had` in natural speech ("I'd already left") versus its
full form in careful or written-style speech, and the weak-form
pronunciation of `been` in past perfect continuous ("I'd been
WORKing").

**Vocabulary reinforcement.** A timeline-sequencing game: learners
order 8 event cards into a correct chronology, then describe the
sequence aloud using past perfect for earlier events.

**Formative assessment.** Instructor checks correct past perfect
formation and, more importantly, correct *logical sequencing* (which
event is marked as earlier) during independent practice — the
lesson's real target skill.

**Homework.** Learners choose one real period of change or growth in
their life or career (a job transition, a move, a skill developed) and
jot down 4-5 rough notes covering "before," "during," and "after,"
ready for Lesson 1.2's reflective work.

**Revision.** Lesson 1.2 opens with learners briefly naming their
homework period of change in one sentence.

**Extension activity.** Stronger learners add one sentence using past
perfect in a negative form ("I hadn't expected that...") or a question
form ("Had you ever...?") for additional productive range.

---

### Lesson 1.2 — "Looking Back — Mixed-Tense Narration & Reflective Writing"

**Learning objectives.** By the end of this lesson you can: (1)
combine present perfect, present perfect continuous, past simple, past
continuous, and past perfect fluently within one extended narrative;
(2) frame a narrative explicitly as reflection using `looking back/in
retrospect`; (3) identify what you didn't realise at the time versus
what you understand now; (4) write a reflective piece with genuine
depth, not just a chronological list.

**Prerequisite knowledge.** Lesson 1.1 (past perfect), all prior
present/past tense work across Levels I-III.

**Warm-up (5 min).** Instructor shares a short real reflection (2-3
sentences) about something they understand differently now than they
did at the time, modelling the "then vs. now understanding" contrast
before formal presentation.

**Presentation (10 min).** Model a short mixed-tense reflective
paragraph, annotated aloud: "I've been thinking about this a lot
recently [present perfect continuous — ongoing]. By the time I changed
careers, I'd already spent five years feeling unfulfilled [past
perfect — earlier state]. I didn't realise it at the time [past simple
— specific past], but I was slowly losing confidence [past continuous
— background state]. Looking back, that period taught me more than
any success has [present perfect — lasting relevance]." Highlight
explicitly: reflective writing moves between tenses *purposefully* —
present perfect connects the past to now; past perfect clarifies
sequence; past simple/continuous narrate the specific experience — and
`looking back/in retrospect` signal the reflective frame itself.

**Guided practice (10 min).** Learners are given a jumbled reflective
paragraph (6 sentences in mixed tenses, shuffled) and reorder it,
identifying which tense each sentence uses and why that tense was the
right choice for its function.

**Independent practice (10 min).** Using their Lesson 1.1 homework
notes, learners draft a reflective paragraph (6-8 sentences) about
their chosen period of change, deliberately using at least 4 different
tense forms from this module and Levels I-III, plus `looking back/in
retrospect`.

**Speaking activity.** Learners read their reflective paragraph aloud
to a partner, who identifies one moment where the writer's
understanding seems to have genuinely changed (not just what
happened, but what they now think about it) — a direct check that the
reflection has real depth, not just chronology.

**Critical thinking / discussion prompt.** "Do you think it's possible
to fully understand an experience while you're still in the middle of
it, or does real understanding only come with distance and time? Why?"
— a genuinely mature B2 question that is, in effect, asking learners
to reflect on the nature of reflection itself.

**Listening activity (5 min).** Listen to a short spoken reflection
(8-9 sentences, deliberately mixed-tense) and identify at least 3
different tense forms used and their function in the narrative.

**Reading activity (5 min).** Read a short written reflective excerpt
(a professional or personal reflection) and annotate it for tense
choices and reflective framing language.

**Writing task (5 min).** Revise your independent-practice paragraph:
add one sentence explicitly contrasting what you thought *then* with
what you understand *now*.

**Pronunciation practice (5 min).** Drill reflective, measured
intonation and pacing — noticeably slower and more thoughtful than
narrative storytelling pace (recycling Level II's storytelling
intonation work by contrast), appropriate to genuine reflection rather
than entertainment.

**Vocabulary reinforcement.** A reflective-language matching game
(this experience taught me, what I didn't realise at the time, with
hindsight, in retrospect) matched to example contexts.

**Formative assessment.** Instructor checks for genuine tense variety
serving a real narrative function (not random switching) and authentic
reflective depth (not just event-listing) during independent practice.

**Homework.** Learners finalise their reflective paragraph into a
fuller piece for Module 1's assignment.

**Revision.** This lesson opens with the Lesson 1.1 change-period
recap. Module 1's Quiz and Assignment draw on both lessons.

**Extension activity.** Stronger learners add a closing sentence
using `since then` to bridge from the reflected-upon past into their
present situation, completing the reflective arc.

---

## Module 1 Quiz (auto-graded, 10 questions)

*Seeded verbatim into `quiz_questions` — see
`sql/seed-curriculum-level-4.sql`. Answer key marked with ✓.*

1. "By the time I arrived, the meeting ___ already started." — (a) has
   (b) had ✓ (c) was (d) did
2. "I'd ___ working there for two years when the company was
   acquired." — (a) be (b) been ✓ (c) being (d) was
3. Which sentence correctly marks the earlier of two past events? —
   (a) I ate breakfast before I woke up. (b) I had already eaten
   breakfast when I left the house. ✓ (c) I have eaten breakfast when
   I left. (d) I was eating breakfast before I leave.
4. "I didn't realise it ___, but I was slowly losing confidence." — (a)
   at the time ✓ (b) since then (c) up until now (d) by then
5. "___, that period taught me more than any success has." (a
   reflective framing phrase) — (a) By the time (b) Looking back ✓ (c)
   Even though (d) As of yet
6. In British formal writing, a more literary variant of "while" is: —
   (a) whilst ✓ (b) whereas (c) since (d) during
7. Which phrase means "make significant progress over time"? — (a)
   turn a corner (b) come a long way ✓ (c) take stock (d) move
   forward
8. "I ___ already left when you called." — (a) have (b) had ✓ (c) was
   (d) did
9. Which tense best emphasises an ongoing state connecting the past
   to now? — (a) past simple (b) past perfect (c) present perfect ✓
   (d) past continuous
10. Which phrase means "pause to assess a situation carefully before
    deciding what's next"? — (a) build on (b) move forward (c) take
    stock ✓ (d) turn a corner

---

## Module 1 Assignment — "Looking Back — A Reflective Piece on Change"

**Instructions given to the learner:** Write (or record) a reflective
piece, 12-15 sentences, about a real period of change or growth in
your life or career (a job transition, a move, a skill you developed,
a challenge you overcame). This is this level's first of eight
distinct writing genres — **reflective writing** — and should read as
genuine reflection, not a chronological list of events. Include: at
least one past perfect sentence clarifying the order of two events; at
least one present perfect continuous sentence describing an ongoing
state or duration; a mix of at least 4 different tense forms overall;
`looking back`/`in retrospect` framing; and an explicit contrast
between what you understood *then* and what you understand *now*.

**Grading rubric (for the instructor):**
- **Grammatical accuracy** — correct past perfect (simple and
  continuous) formation, correct tense choices across the piece.
- **Vocabulary range** — at least 4 distinct change/growth or
  reflective-language words used correctly, plus one phrasal verb/
  collocation from this module.
- **Task completion** — clear sequencing of at least two past events,
  a then-vs-now contrast, and reflective framing language all present.
- **Communicative quality** — does the reflection show genuine,
  specific insight (not a generic "I learned a lot"), and does it
  read as authentic reflection rather than a plain narrative?
- **Discourse coherence & register** — does the piece flow as one
  connected reflective account with purposeful (not random) tense
  variety, and is the register appropriately thoughtful and personal
  without becoming a bare list?

A grade at or above the platform's pass threshold marks Module 1
completed for the learner.
