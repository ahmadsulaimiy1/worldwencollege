# WEC — Level V: Advanced Programme (C1) — Full Curriculum

*Companion to `docs/curriculum-framework.md` (see its Level V section
for the module map, grammar/vocabulary progression, and the Executive
Academic Objective this build implements) and
`docs/curriculum-level-4-upper-intermediate.md` (Level IV, the process
this level continues). Written to your standing instruction that "at
C1, learners should no longer be treated as language learners alone" —
they begin functioning as academics, professionals, executives,
researchers, entrepreneurs, and global communicators. See § What's
different from Level IV below for exactly how this build answers
that, module by module.*

---

## What's different from Level IV, and why

Level IV built genuine academic and professional competence across
eight writing genres and a varied speaking programme. Level V moves
**beyond language competence into intellectual communication** — the
level's explicit, defining shift. Concretely:

- **Critical evaluation, not just analysis.** Level IV taught learners
  to identify an author's purpose, bias, and tone. Level V asks
  learners to evaluate *how well an argument is actually made* —
  methodology, the quality and sufficiency of evidence, unstated
  assumptions, credibility, and the real-world implications of a
  claim — the genuine intellectual work of a critical reader, not just
  a describing one.
- **Ten distinct advanced writing genres**, deliberately distributed
  across the level's nine content modules, each taught for its own
  real communicative purpose: professional documentation (Module 1), a
  literature review (Module 2), a position paper (Module 3), a policy
  brief (Module 4), an analytical paper (Module 5), a persuasive
  article (Module 6), a research essay and a conference abstract
  (Module 7), a strategic proposal (Module 8), and an executive report
  (Module 9).
- **A genuinely executive/professional speaking programme.** A
  leadership speech and negotiation (Module 3), a stakeholder meeting
  (Module 4), intercultural negotiation (Module 5), a media interview
  (Module 6), the flagship 6-8 minute conference presentation with Q&A
  facilitation (Module 7), a crisis-communication simulation and panel
  discussion under challenge (Module 8), and an executive briefing
  (Module 9) — the range of real high-stakes speaking situations a
  C1 professional actually encounters.
- **Nuance, register, and rhetorical control become the core content,
  not a finishing touch.** Idiom and collocation (Module 1), inversion
  for rhetorical emphasis (Module 3), cleft sentences for emphasis in
  persuasive/media writing (Module 6), and mixed conditionals used
  fluently and flexibly (Module 1) — the grammar of *precision and
  effect*, not just correctness.
- **Strategic thinking and intercultural negotiation as standing
  content.** Cross-cultural pragmatics and politeness strategies get
  their own dedicated module (Module 5) rather than a single lesson,
  reflecting how much genuine skill is required to negotiate and
  communicate diplomatically across cultural norms at this level.
- **Authentic, high-stakes professional contexts throughout.**
  International organisations, multinational companies, universities,
  government agencies, NGOs, consulting, entrepreneurship, and public
  policy are woven into the module themes below — generic, realistic
  framing per `docs/editorial-bible.md`'s standing discipline (no
  fabricated real organisation, partnership, or statistic is ever
  implied).
- **A distinctive WEC progression, not an imitation.** The module
  sequence — precision of language (Modules 1-2) → precision of
  persuasion (Modules 3-4) → precision across cultures and contexts
  (Modules 5-6) → precision under scrutiny (Modules 7-8) → precision of
  voice (Module 9) — is authored as WEC's own intellectual arc, per
  your directive that this level "establish WEC as a premium
  international English institution," not a copy of any single
  existing programme.

**Same as Levels I-IV, unchanged:** the lesson template's required
elements (objectives, prerequisite knowledge, warm-up, presentation,
guided/independent practice, all four skills, pronunciation,
vocabulary, formative assessment, homework, revision, extension), the
seed-file-into-live-schema pipeline, and full end-to-end LMS
verification for every module. Assignment rubrics keep Level IV's
"evidence & argument quality" and "discourse coherence & register"
criteria and add, where the genre calls for it, **rhetorical
effectiveness** (does the piece actually persuade or land with its
intended audience, not merely state a correct argument) as a named
rubric criterion — assessing authentic, C1-level performance, per your
directive, not memorisation.

**On AI integration.** As at Levels III-IV, this level's rubrics are
authored as named, weighted, machine-legible criteria so a future AI
tutor could plausibly assist with feedback, pronunciation coaching, or
adaptive pathway recommendation against the same rubric an instructor
uses — a design property, not a build instruction. No AI-assessment
code is introduced in this curriculum pass.

---

## Level V module map

| # | Module | Can-do focus | Key grammar | Writing genre / speaking format | Full module document |
|---|---|---|---|---|---|
| 1 | Nuance & Idiom | Combine conditionals flexibly; shift register precisely for audience | mixed conditionals | professional documentation (a style guide) | *below, in this document* |
| 2 | Academic Writing III | Synthesise a body of sources into a literature review | advanced ellipsis/substitution/cohesion at essay level | literature review | `docs/curriculum/level-5/module-02-academic-writing-iii.md` |
| 3 | Leadership & Persuasion | Persuade and lead using rhetorical emphasis; negotiate as a leader | inversion for emphasis | position paper; leadership speech + negotiation | `docs/curriculum/level-5/module-03-leadership-persuasion.md` |
| 4 | Complex Systems (Science, Economics, Policy) | Discuss technical/policy issues with appropriate hedging and precision | advanced nominalisation, hedging modality | policy brief; stakeholder meeting | `docs/curriculum/level-5/module-04-complex-systems.md` |
| 5 | Cross-Cultural Communication | Navigate politeness and pragmatics across cultures; negotiate diplomatically | advanced modality for politeness/register | analytical paper; intercultural negotiation | `docs/curriculum/level-5/module-05-cross-cultural-communication.md` |
| 6 | Advanced Media & Discourse Analysis | Analyse rhetorical strategy and subtext at depth; write persuasively | cleft sentences | persuasive article; media interview | `docs/curriculum/level-5/module-06-advanced-media-discourse-analysis.md` |
| 7 | Research & Presentation | Structure and deliver a research-informed presentation; facilitate Q&A | discourse markers for complex argument structuring | research essay + conference abstract; flagship conference presentation | `docs/curriculum/level-5/module-07-research-presentation.md` |
| 8 | Professional Advocacy | Build and defend a case under challenge | advanced passive, formal register under pressure | strategic proposal; crisis communication + panel discussion | `docs/curriculum/level-5/module-08-professional-advocacy.md` |
| 9 | Style & Voice | Edit and vary register/tone precisely for audience and purpose | consolidated cohesion & register control | executive report; executive briefing | `docs/curriculum/level-5/module-09-style-voice.md` |
| 10 | Review & Consolidation | Consolidate all Level V outcomes; Advanced-level mock exam | cumulative review | cumulative review | `docs/curriculum/level-5/module-10-review-consolidation.md` |

**Level V is now complete** — all 10 modules built to full
publication-quality depth and seeded into the live schema via
`sql/seed-curriculum-level-5.sql`, verified end-to-end by
`tests/curriculum-level-5.test.mjs` (84 assertions: every module loads
with a reading/quiz/assignment, every quiz's own seeded correct
answers score 100% when submitted, no quiz ever leaks its answer key
to the client, every assignment can be submitted and staff-graded, and
a weak attempt correctly fails). All ten distinct advanced writing
genres named in the Executive Academic Objective — professional
documentation, a literature review, a position paper, a policy brief,
an analytical paper, a persuasive article, a conference abstract, a
research essay, a strategic proposal, and an executive report — are
represented across the ten modules, alongside a genuinely executive/
professional speaking programme (a leadership speech, advanced
negotiation, a stakeholder meeting, intercultural negotiation, a media
interview, the flagship 6-8 minute conference presentation with Q&A
facilitation, a crisis-communication simulation, a panel discussion
under challenge, and an executive briefing).

---

## Module 1: Nuance & Idiom — full build

### Module overview

Module 1 opens Level V by combining everything the programme has
built toward flexible, natural conditional use — **mixed
conditionals**, where the time reference of the `if`-clause and the
result clause don't have to match ("If I had studied medicine, I'd be
a doctor now" — a past condition, a present result). Paired with this
is the level's defining vocabulary shift: **idiom, collocation, and
register** as deliberate, precise tools, not incidental colour — the
foundation for this module's writing genre, **professional
documentation**, where precisely controlling register for a given
audience is the entire point.

**Module learning objectives.** By the end of Module 1, the learner
can: form and use mixed conditionals correctly and naturally; choose
idiomatic expressions and collocations that fit a specific register;
deliberately shift the same message across formal, semi-formal, and
informal register for different audiences; write a short professional
document (a communication style guide) demonstrating precise register
control.

**Content map (5 learning items):** module overview & key phrases;
Lesson 1.1 ("If I Had Studied That, I'd Be... — Mixed Conditionals");
Lesson 1.2 ("Reading the Room — Idiom, Collocation & Register-
Shifting"); Module 1 Quiz (10 questions); Module 1 Assignment ("A
Communication Style Guide").

---

### Reference reading: Module overview & key phrases

**Key phrases introduced this module:** If I had..., I'd be... — If I
were..., I would have... — To put it bluntly,... — In a nutshell,...
— At the end of the day,... — For what it's worth,...

**Discourse markers this module (functional set — idiomatic hedging
and framing, register-graded):** *to put it bluntly* (direct,
informal-to-neutral), *in a nutshell* (neutral, summarising), *at the
end of the day* (neutral-to-informal, concluding), *for what it's
worth* (a modest hedge before an opinion) — deliberately presented
together with a note on which register each suits, since idiomatic
framing language is itself register-sensitive in a way that plainer
connectors (`however, therefore`) are not.

**Phrasal verbs & collocations this module (meta-communicative — about
precise communication itself):** *get to the point* (stop delaying
and state the main idea), *read between the lines* (understand an
implied meaning, not just the literal words), *strike the right tone*
(communicate with appropriate register/attitude for the situation),
*walk a fine line* (balance two competing concerns carefully), *choose
your words carefully* (self-explanatory, and genuinely this module's
governing principle).

**BrE / AmE note:** the same idiom can differ grammatically between
varieties: British English says **at a loose end** (singular "end,"
meaning having nothing to do), while American English says **at loose
ends** (plural) for the identical meaning — a genuinely subtle
illustration that idiomatic English isn't just vocabulary that
differs, but sometimes grammar within the very same fixed expression.

**Key vocabulary previewed:** register vocabulary (formal, informal,
neutral, colloquial, register-appropriate), documentation vocabulary
(style guide, tone of voice, audience, convention). Intercultural
note: what counts as "appropriately direct" versus "too blunt," and
which idioms travel well internationally versus sound obscure outside
one variety of English, varies significantly; this module deliberately
favours widely-understood idiomatic language and flags anything more
regionally specific.

---

### Lesson 1.1 — "If I Had Studied That, I'd Be... — Mixed Conditionals"

**Learning objectives.** By the end of this lesson you can: (1) form a
mixed conditional with a past condition and a present result (`If I
had + past participle, I would + base verb`); (2) form a mixed
conditional with a present/general condition and a past result (`If I
were/weren't + adjective/noun, I would have + past participle`); (3)
choose correctly between a "pure" second/third conditional (Levels
III-IV) and a mixed conditional based on the actual time references
involved; (4) use mixed conditionals naturally in reflective and
professional speech.

**Prerequisite knowledge.** Level III, Module 8 (second conditional);
Level IV, Module 3 (third conditional) — this lesson combines both
into a single flexible system.

**Warm-up (5 min).** Instructor states one real reflection with
mismatched time references ("If I hadn't taken that internship, I
probably wouldn't be working in this field now") and asks learners to
identify which part is about the past and which is about the present,
before formal presentation.

**Presentation (10 min).** Model: "If I had studied medicine, I'd be a
doctor now" (past condition — an unreal past decision — present
result — a hypothetical current state). "If I weren't so cautious by
nature, I would have taken that risk back then" (present/general
condition — an ongoing trait — past result — a hypothetical past
action). Highlight explicitly: mixed conditionals exist because real
reflection rarely respects tidy single-timeframe boundaries — a past
decision has present consequences; a present trait would have changed
a past outcome — and fluent C1 English moves between these
combinations naturally, not just in the "pure" forms drilled at
earlier levels.

**Guided practice (10 min).** Learners are given 8 real-sounding
reflective sentence pairs and combine each into a correctly mixed
conditional, identifying which clause is past and which is present.

**Independent practice (10 min).** Learners write 5 mixed-conditional
sentences reflecting on real or invented past decisions and their
present consequences (or present traits and past outcomes), then
share one with a partner, who identifies the time reference of each
clause.

**Speaking activity.** The partner identification exchange above,
followed by a brief whole-class share of one particularly natural-
sounding mixed conditional per pair.

**Critical thinking / discussion prompt.** "Do you think people
reflect on their lives more often using 'pure' hypotheticals (all one
timeframe) or mixed ones (past decisions, present consequences)? Why
might mixed reflection feel more natural?" — a genuinely sophisticated
C1 question linking the grammar's function to real cognitive/
reflective habits.

**Listening activity (5 min).** Listen to someone reflecting using
mixed conditionals (6-7 sentences) and identify the time reference of
each clause in each sentence.

**Reading activity — extended reading & critical evaluation (8 min).**
Read a short professional reflection excerpt (150-180 words) using
mixed conditionals. Answer 2 literal questions and 2 evaluative
questions ("Does the writer's use of mixed conditionals here strike
you as a genuine, considered reflection, or a slightly rehearsed
rhetorical device? What in the text makes you read it that way?").

**Writing task (5 min).** Write 4-5 mixed-conditional sentences
reflecting on your own real decisions and their consequences, checking
carefully that each clause's time reference is correct.

**Pronunciation practice (5 min).** Drill the heavily contracted,
natural-speed pronunciation of mixed conditionals ("If I'd studied
medicine, I'd be a doctor now" — both `'d` contractions doing
different grammatical work, `had` and `would`) — a genuine listening-
comprehension challenge worth making explicit.

**Vocabulary reinforcement.** A conditional-type sorting game: sort 10
example sentences into second, third, or mixed conditional, reviewing
the full system built across Levels III-V.

**Formative assessment.** Instructor checks correct mixed-conditional
formation and correct identification of each clause's time reference
during independent practice — the lesson's core target skill.

**Homework.** Learners think of one real professional or personal
message they'd need to communicate differently to three different
audiences (e.g. a close colleague, their manager, an external client)
and jot down brief notes, ready for Lesson 1.2's register-shifting
work.

**Revision.** Lesson 1.2 opens with learners briefly naming their
homework message in one sentence.

**Extension activity.** Stronger learners add a third mixed-
conditional sentence combining a hypothetical future consequence with
a past cause, previewing even more flexible combination.

---

### Lesson 1.2 — "Reading the Room — Idiom, Collocation & Register-Shifting"

**Learning objectives.** By the end of this lesson you can: (1) use a
range of C1-level idiomatic expressions and collocations naturally and
correctly; (2) identify the register (formal/neutral/informal) of a
given expression; (3) deliberately rewrite the same message across
three registers for three different audiences; (4) write a short
professional document demonstrating consistent, precise register
control.

**Prerequisite knowledge.** Lesson 1.1 (mixed conditionals — recycled
lightly here), all prior levels' cumulative vocabulary and register
work (especially Level IV Module 9's precursor register-editing
focus).

**Warm-up (5 min).** Instructor delivers the same short message three
times — to a close friend, to a manager, and in a formal written
announcement — asking learners to identify what specifically changed
(word choice, contractions, idiom, sentence length), before formal
presentation.

**Presentation (10 min).** Model three versions of one message
explicitly: **informal** ("Hey, heads up — we're a bit behind on this,
so let's touch base tomorrow and sort it out"); **neutral/
professional** ("Just to flag — we're slightly behind schedule on
this. Could we catch up tomorrow to discuss next steps?"); **formal**
("I am writing to inform you that the project is currently behind
schedule. I would welcome the opportunity to discuss this further at
your earliest convenience."). Highlight explicitly: the *content* is
identical across all three — what changes is idiom choice, contraction
use, sentence length, and directness — genuine register control, the
practical skill underlying this module's writing genre.

**Guided practice (10 min).** Learners are given 8 idiomatic
expressions/collocations and sort them by register (formal/neutral/
informal), then rewrite 3 informal sentences into neutral/professional
register.

**Independent practice (10 min).** Using their Lesson 1.1 homework
notes, learners rewrite their chosen message in all three registers
(informal, neutral/professional, formal), then read their three
versions to a partner, who identifies which register each version
represents without being told.

**Speaking activity.** The partner identification exchange above,
followed by a brief whole-class discussion of any version where the
register was ambiguous or unclear, and why.

**Critical thinking / discussion prompt.** "Is it possible to be
'too formal' or 'too informal' in a way that actually damages
communication, even if the grammar is perfectly correct? Can you think
of an example?" — a genuinely sophisticated C1 question about register
as a communicative skill, not just a stylistic preference.

**Listening activity (5 min).** Listen to the same short message
delivered in two different registers and identify specific words/
phrases that signal each register.

**Reading activity (5 min).** Read a short style-guide excerpt (a
generic, invented professional communication guide) and identify its
register recommendations and example idiomatic phrases for different
contexts.

**Writing task (5 min).** Draft the opening section of your Module 1
assignment: a one-paragraph introduction to your communication style
guide, explaining its purpose and intended audience.

**Pronunciation practice (5 min).** Drill the prosodic differences
between registers — informal speech's faster pace, more contraction,
and wider pitch range, versus formal speech's more measured pace,
fuller forms, and more level intonation — a genuine fluency point
about how register is signalled by sound, not just word choice.

**Vocabulary reinforcement.** A register-sorting relay: learners sort
12 idiomatic expressions/collocations into formal/neutral/informal
columns as quickly and accurately as possible.

**Formative assessment.** Instructor checks that all three register
versions preserve the same core content while genuinely differing in
register markers, during independent practice.

**Homework.** Learners finalise their communication style guide draft
for Module 1's assignment.

**Revision.** This lesson opens with the Lesson 1.1 message-naming
recap. Module 1's Quiz and Assignment draw on both lessons.

**Extension activity.** Stronger learners add a fourth "regional
variation" note to their style guide, flagging one idiom from this
module's BrE/AmE note as an example of register/regional awareness
combined.

---

## Module 1 Quiz (auto-graded, 10 questions)

*Seeded verbatim into `quiz_questions` — see
`sql/seed-curriculum-level-5.sql`. Answer key marked with ✓.*

1. "If I ___ medicine, I'd be a doctor now." (past condition, present
   result) — (a) studied (b) had studied ✓ (c) have studied (d) study
2. "If I weren't so cautious by nature, I ___ that risk back then."
   (present condition, past result) — (a) would take (b) would have
   taken ✓ (c) took (d) had taken
3. Which sentence is a "pure" third conditional, not mixed? — (a) If I
   had studied medicine, I'd be a doctor now. (b) If I had known, I
   would have said something. ✓ (c) If I weren't so cautious, I would
   have taken that risk. (d) If I hadn't taken that internship, I
   wouldn't be here now.
4. "___, we're a bit behind on this." (informal register) — (a) I am
   writing to inform you that (b) Just to flag (c) Hey, heads up ✓ (d)
   I would welcome the opportunity to
5. "I would welcome the opportunity to discuss this ___." (formal
   register) — (a) at your earliest convenience ✓ (b) whenever, no
   rush (c) soon-ish (d) ASAP
6. In British English, having nothing to do is described as being: —
   (a) at loose ends (b) at a loose end ✓ (c) at a loose end's (d) at
   loose end
7. Which phrase means "understand an implied meaning, not just the
   literal words"? — (a) get to the point (b) read between the lines
   ✓ (c) strike the right tone (d) walk a fine line
8. Which phrase means "communicate with appropriate register/attitude
   for the situation"? — (a) get to the point (b) read between the
   lines (c) strike the right tone ✓ (d) walk a fine line
9. What is the core skill this module's writing genre (professional
   documentation) requires? — (a) using as many idioms as possible (b)
   precise, consistent register control for a given audience ✓ (c)
   avoiding all idiomatic language (d) writing as formally as possible
   at all times
10. "___, that period taught me more than any success has." (an
    idiomatic concluding frame) — (a) To put it bluntly (b) At the end
    of the day ✓ (c) For what it's worth (d) In a nutshell

---

## Module 1 Assignment — "A Communication Style Guide"

**Instructions given to the learner:** Write a short professional
document, 300-400 words, in the genre of **professional
documentation** — a communication style guide for a real or invented
team or organisation. Include: a one-paragraph introduction explaining
the guide's purpose and audience; the same example message written in
three distinct registers (informal, neutral/professional, formal),
each labelled; at least 5 idiomatic expressions or collocations from
this module, used correctly and appropriately for their labelled
register; at least one mixed-conditional sentence (e.g. explaining why
a past communication choice would have present-day consequences); and
a short closing section of practical guidance for choosing register
appropriately.

**Grading rubric (for the instructor):**
- **Grammatical accuracy** — correct mixed-conditional formation.
- **Vocabulary range** — at least 5 distinct idiomatic expressions/
  collocations used correctly, plus correct register-sorting of each.
- **Task completion** — introduction, three registered versions of one
  message, a mixed conditional, and practical guidance all present.
- **Rhetorical effectiveness** *(new at this level)* — would this
  guide actually help a real reader choose the right register for a
  real situation, or is the guidance too vague or generic to be
  useful?
- **Discourse coherence & register** — is each of the three example
  versions genuinely, consistently written in its labelled register
  (not drifting between registers within one version), and is the
  guide itself written in an appropriately professional,
  documentation-style register throughout?

A grade at or above the platform's pass threshold marks Module 1
completed for the learner.
